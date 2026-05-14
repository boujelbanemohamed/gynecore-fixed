import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkSlotAvailability } from './unavailableSlotController';
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
} from '../services/emailService';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

const getDocId = async (uid: string) => {
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { doctorId: true } });
  if (!u?.doctorId) throw new Error('Secretaire non associe a un medecin');
  return u.doctorId;
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const [tp, tc, ta, tday] = await Promise.all([
      prisma.patient.count({ where: { doctorId: did } }),
      prisma.consultation.count({ where: { patient: { doctorId: did } } }),
      prisma.appointment.count({ where: { doctorId: did } }),
      prisma.appointment.count({ where: { doctorId: did, startTime: { gte: today, lt: tomorrow } } }),
    ]);
    res.json({ success: true, data: { totalPatients: tp, totalConsultations: tc, totalAppointments: ta, todayAppointments: tday } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getDoctorInfo = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const d = await prisma.user.findUnique({ where: { id: did }, select: { firstName: true, lastName: true, email: true, phone: true, specialization: true, address: true, city: true, postalCode: true, country: true } });
    res.json({ success: true, data: d });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Minimum 6 caracteres' });
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (!u) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    if (!(await bcrypt.compare(currentPassword, u.password))) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    await prisma.user.update({ where: { id: uid }, data: { password: await bcrypt.hash(newPassword, 10) } });
    res.json({ success: true, message: 'Mot de passe modifie avec succes' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const s = req.query.search as string;
    const where: any = { doctorId: did };
    if (s) where.OR = [
      { user: { firstName: { contains: s, mode: 'insensitive' } } },
      { user: { lastName: { contains: s, mode: 'insensitive' } } },
      { user: { phone: { contains: s } } },
    ];
    const patients = await prisma.patient.findMany({
      where, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { patients, total: patients.length } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const p = await prisma.patient.findFirst({
      where: { id: req.params.id, doctorId: did },
      include: {
        user: true,
        consultations: { orderBy: { date: 'desc' }, take: 20 },
        appointments: { orderBy: { startTime: 'desc' }, take: 20 },
      },
    });
    if (!p) return res.status(404).json({ success: false, message: 'Patient non trouve' });
    res.json({ success: true, data: p });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const { firstName, lastName, email, phone, dateOfBirth, address, city, postalCode, country } = req.body;
    if (!dateOfBirth) return res.status(400).json({ success: false, message: 'dateOfBirth requis' });
    if (email) { const ex = await prisma.user.findUnique({ where: { email } }); if (ex) return res.status(400).json({ success: false, message: 'Email deja utilise' }); }
    const u = await prisma.user.create({
      data: { firstName, lastName, email, phone, role: 'PATIENT', password: 'GyneCare2024', patient: { create: { doctorId: did, dateOfBirth: new Date(dateOfBirth), address, city, postalCode, country } } },
      include: { patient: true },
    });
    res.json({ success: true, data: u });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const updatePatientAdmin = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const { id } = req.params;
    const p = await prisma.patient.findFirst({ where: { id, doctorId: did } });
    if (!p) return res.status(404).json({ success: false, message: 'Patient non trouve' });
    const uFields = ['firstName','lastName','email','phone'];
    const pFields = ['dateOfBirth','cin','address','city','postalCode','country','insurance','insuranceNumber'];
    const ud: any = {}; const pd: any = {};
    for (const k of [...uFields,...pFields]) {
      if (req.body[k] !== undefined) {
        if (uFields.includes(k)) ud[k] = req.body[k];
        if (pFields.includes(k)) pd[k] = k === 'dateOfBirth' && req.body[k] ? new Date(req.body[k]) : req.body[k];
      }
    }
    if (Object.keys(ud).length) await prisma.user.update({ where: { id: p.userId }, data: ud });
    if (Object.keys(pd).length) await prisma.patient.update({ where: { id }, data: pd });
    const updated = await prisma.patient.findUnique({ where: { id }, include: { user: true } });
    res.json({ success: true, data: updated });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getConsultations = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const c = await prisma.consultation.findMany({
      where: { patient: { doctorId: did } },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { date: 'desc' }, take: 100,
    });
    res.json({ success: true, data: { consultations: c } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const { startDate, endDate } = req.query;
    const where: any = { doctorId: did };
    if (startDate && endDate) where.startTime = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    const a = await prisma.appointment.findMany({
      where, include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { startTime: 'asc' },
    });
    res.json({ success: true, data: { appointments: a } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const { patientId, startTime, endTime, type, reason, notes, status } = req.body;
    if (!patientId || !startTime || !endTime) return res.status(400).json({ success: false, message: 'patientId, startTime et endTime sont requis' });
    const isAvailable = await checkSlotAvailability(did, new Date(startTime), new Date(endTime));
    if (!isAvailable) {
      return res.status(409).json({ success: false, message: 'Ce creneau est indisponible. Veuillez choisir un autre horaire.' });
    }
    const a = await prisma.appointment.create({
      data: {
        patientId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: type || 'FIRST_VISIT',
        reason: reason || '',
        notes: notes || '',
        status: status || 'SCHEDULED',
        doctorId: did,
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });
    res.json({ success: true, data: a });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const a = await prisma.appointment.findFirst({ where: { id: req.params.id, doctorId: did } });
    if (!a) return res.status(404).json({ success: false, message: 'Rendez-vous non trouve' });
    const { patientId, startTime, endTime, type, reason, notes, status } = req.body;
    const updateData: any = {};
    if (patientId) updateData.patientId = patientId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (type) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    const up = await prisma.appointment.update({ where: { id: req.params.id }, data: updateData, include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } } });
    res.json({ success: true, data: up });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const a = await prisma.appointment.findFirst({ where: { id: req.params.id, doctorId: did } });
    if (!a) return res.status(404).json({ success: false, message: 'Rendez-vous non trouve' });
    const newStatus = req.body.status as string;
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
          await sendAppointmentConfirmationEmail(patientData.doctorId, patientEmail, {
            patientFirstName: patientData.patient.user.firstName,
            patientLastName: patientData.patient.user.lastName,
            doctorFirstName: patientData.doctor.firstName,
            doctorLastName: patientData.doctor.lastName,
            date: frDate, time: frTime, type: patientData.type,
            clinicName: patientData.doctor.clinicName, clinicAddress: patientData.doctor.address,
          });
        } else if (newStatus === 'CANCELLED') {
          await sendAppointmentCancellationEmail(patientData.doctorId, patientEmail, {
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

    res.json({ success: true, data: up });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const did = await getDocId((req as any).user.userId);
    const a = await prisma.appointment.findFirst({ where: { id: req.params.id, doctorId: did } });
    if (!a) return res.status(404).json({ success: false, message: 'Rendez-vous non trouve' });
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Supprime' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};
