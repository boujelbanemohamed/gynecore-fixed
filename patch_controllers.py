#!/usr/bin/env python3
"""
GyneCare SMTP Installation Patcher
Patches existing controllers to add email functionality.
Run from the backend/ directory.
"""
import os
import sys

def patch_password_reset():
    filepath = 'src/controllers/passwordResetController.ts'
    if not os.path.exists(filepath):
        print(f'  -> Fichier non trouve: {filepath}')
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    changed = False
    
    # Add import
    if 'emailService' not in content:
        content = content.replace(
            'import { prisma } from "../prisma";',
            'import { prisma } from "../prisma";\nimport { sendPasswordResetEmail } from "../services/emailService";'
        )
        print('  -> Import emailService ajoute')
        changed = True
    
    # Replace console.log with email sending
    if 'await sendPasswordResetEmail' not in content:
        old = '    // En production : envoyer un email ici\n    // Pour le moment : afficher le token dans la console\n    console.log(`[RESET] Token pour ${email}: ${resetToken}`);'
        new = """    // Envoi de l'email de reinitialisation via SMTP
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      console.error("[forgotPassword] Erreur envoi email, fallback console:", emailErr);
      console.log(`[RESET-FALLBACK] Token pour ${email}: ${resetToken}`);
    }"""
        if old in content:
            content = content.replace(old, new)
            print('  -> forgotPassword patche avec envoi email')
            changed = True
        else:
            print('  -> ATTENTION: Structure differente dans forgotPassword, patch manuel requis')
    
    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
    return changed

def patch_appointment_controller():
    filepath = 'src/controllers/appointmentController.ts'
    if not os.path.exists(filepath):
        print(f'  -> Fichier non trouve: {filepath}')
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    changed = False
    
    # Add imports
    if 'emailService' not in content:
        old_import = "import { checkSlotAvailability } from './unavailableSlotController';"
        new_import = old_import + '\n' + """import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
} from '../services/emailService';"""
        if old_import in content:
            content = content.replace(old_import, new_import)
            print('  -> Imports email ajoutes')
            changed = True
    
    # Add helper functions
    if 'formatDateFr' not in content:
        helpers = """
// ── Helpers ────────────────────────────────────────────────────────

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTimeFr(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}
"""
        marker = '// ── Controleurs'
        if marker in content:
            content = content.replace(marker, helpers + '\n' + marker)
            print('  -> Helpers formatDateFr/formatTimeFr ajoutes')
            changed = True
    
    # Patch updateAppointmentStatus
    if 'sendAppointmentConfirmationEmail(patientEmail' not in content:
        old_find = 'const current = await prisma.appointment.findFirst({ where: { id, doctorId } });'
        new_find = """const current = await prisma.appointment.findFirst({
      where: { id, doctorId },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { select: { firstName: true, lastName: true, clinicName: true, address: true } },
      },
    });"""
        if old_find in content:
            content = content.replace(old_find, new_find)
        
        old_update = """const appointment = await prisma.appointment.update({ where: { id }, data: { status } });
    return res.json({ success: true, data: appointment });"""
        
        new_update = """const appointment = await prisma.appointment.update({ where: { id }, data: { status } });

    // Envoi d'email alerte selon le nouveau statut
    const patientEmail = current.patient?.user?.email;
    if (patientEmail) {
      try {
        if (status === AppointmentStatus.CONFIRMED) {
          await sendAppointmentConfirmationEmail(patientEmail, {
            patientFirstName: current.patient.user.firstName,
            patientLastName: current.patient.user.lastName,
            doctorFirstName: current.doctor.firstName,
            doctorLastName: current.doctor.lastName,
            date: formatDateFr(new Date(current.startTime)),
            time: formatTimeFr(new Date(current.startTime)),
            type: current.type,
            clinicName: current.doctor.clinicName,
            clinicAddress: current.doctor.address,
          });
        } else if (status === AppointmentStatus.CANCELLED) {
          await sendAppointmentCancellationEmail(patientEmail, {
            patientFirstName: current.patient.user.firstName,
            patientLastName: current.patient.user.lastName,
            doctorFirstName: current.doctor.firstName,
            doctorLastName: current.doctor.lastName,
            date: formatDateFr(new Date(current.startTime)),
            time: formatTimeFr(new Date(current.startTime)),
          });
        }
      } catch (emailErr) {
        console.error('[updateAppointmentStatus] Erreur envoi email alerte:', emailErr);
      }
    }

    return res.json({ success: true, data: appointment });"""
        
        if old_update in content:
            content = content.replace(old_update, new_update)
            print('  -> updateAppointmentStatus patche avec alertes email')
            changed = True
        else:
            print('  -> ATTENTION: Structure differente dans updateAppointmentStatus')
    
    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
    return changed

def patch_secretary_portal():
    filepath = 'src/controllers/secretaryPortalController.ts'
    if not os.path.exists(filepath):
        print(f'  -> Fichier non trouve: {filepath}')
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'sendAppointmentConfirmationEmail' in content:
        print('  -> Deja patche')
        return False
    
    changed = False
    
    # Add imports
    old_import = "import { checkSlotAvailability } from './unavailableSlotController';"
    new_import = old_import + '\n' + """import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
} from '../services/emailService';"""
    if old_import in content:
        content = content.replace(old_import, new_import)
        print('  -> Imports email ajoutes')
        changed = True
    
    # Add AppointmentStatus import
    if 'AppointmentStatus' not in content:
        content = content.replace(
            'import { PrismaClient }',
            'import { AppointmentStatus } from "@prisma/client";\nimport { PrismaClient }'
        )
        print('  -> Import AppointmentStatus ajoute')
        changed = True
    
    # Patch updateAppointmentStatus
    old_secretary = """const up = await prisma.appointment.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json({ success: true, data: up });"""
    
    new_secretary = """const newStatus = req.body.status as string;
    const up = await prisma.appointment.update({ where: { id: req.params.id }, data: { status: newStatus } });

    // Envoi d'email alerte au patient
    const patientData = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { select: { firstName: true, lastName: true, clinicName: true, address: true } },
      },
    });
    const patientEmail = patientData?.patient?.user?.email;
    if (patientEmail && patientData) {
      try {
        const frDate = new Date(patientData.startTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const frTime = new Date(patientData.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        if (newStatus === 'CONFIRMED') {
          await sendAppointmentConfirmationEmail(patientEmail, {
            patientFirstName: patientData.patient.user.firstName,
            patientLastName: patientData.patient.user.lastName,
            doctorFirstName: patientData.doctor.firstName,
            doctorLastName: patientData.doctor.lastName,
            date: frDate, time: frTime, type: patientData.type,
            clinicName: patientData.doctor.clinicName, clinicAddress: patientData.doctor.address,
          });
        } else if (newStatus === 'CANCELLED') {
          await sendAppointmentCancellationEmail(patientEmail, {
            patientFirstName: patientData.patient.user.firstName,
            patientLastName: patientData.patient.user.lastName,
            doctorFirstName: patientData.doctor.firstName,
            doctorLastName: patientData.doctor.lastName,
            date: frDate, time: frTime,
          });
        }
      } catch (emailErr) {
        console.error('[sec.updateAppointmentStatus] Erreur email:', emailErr);
      }
    }

    res.json({ success: true, data: up });"""
    
    if old_secretary in content:
        content = content.replace(old_secretary, new_secretary)
        print('  -> secretaryPortal updateAppointmentStatus patche')
        changed = True
    else:
        print('  -> ATTENTION: Structure differente dans secretaryPortalController')
    
    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
    return changed

if __name__ == '__main__':
    print('============================================')
    print('  GYNECARE - Patch SMTP Controllers')
    print('============================================')
    
    all_ok = True
    
    print('\n[1/3] Patch passwordResetController.ts...')
    if not patch_password_reset():
        all_ok = False
    
    print('\n[2/3] Patch appointmentController.ts...')
    if not patch_appointment_controller():
        all_ok = False
    
    print('\n[3/3] Patch secretaryPortalController.ts...')
    if not patch_secretary_portal():
        all_ok = False
    
    if all_ok:
        print('\n============================================')
        print('  Tous les patches appliques avec succes')
        print('============================================')
    else:
        print('\n============================================')
        print('  Certains patches ont echoue - verifiez')
        print('============================================')
        sys.exit(1)
