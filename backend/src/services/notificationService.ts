import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { decrypt } from '../utils/encryption';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'system-config.json');
const transportCache = new Map<string, nodemailer.Transporter>();

interface TemplateConfig {
  subject: string;
  body: string;
}

export interface TemplateContext {
  doctorFirstName?: string;
  doctorLastName?: string;
  doctorEmail?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientEmail?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  appointmentStatus?: string;
  appointmentReason?: string;
  clinicName?: string;
  clinicAddress?: string;
  secretaryFirstName?: string;
  secretaryLastName?: string;
  reason?: string;
  [key: string]: string | undefined;
}

function getTemplates(): Record<string, TemplateConfig> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return config.emailTemplates || {};
    }
  } catch { /* ignore */ }
  return {};
}

function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return context[key] !== undefined ? context[key] : `{{${key}}}`;
  });
}

async function getSmtpConfigForDoctor(doctorId: string) {
  const config = await prisma.smtpConfig.findUnique({ where: { doctorId } });
  if (config && config.enabled) {
    return {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      user: config.smtpUser,
      pass: decrypt(config.smtpPass),
      fromName: config.smtpFromName,
      fromEmail: config.smtpFromEmail,
    };
  }
  const envUser = process.env.SMTP_USER || '';
  const envPass = process.env.SMTP_PASS || '';
  if (!envUser || !envPass) return null;
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    user: envUser,
    pass: envPass,
    fromName: process.env.SMTP_FROM_NAME || 'GyneCare',
    fromEmail: process.env.SMTP_FROM_EMAIL || envUser,
  };
}

function getTransporter(doctorId: string, cfg: { host: string; port: number; secure: boolean; user: string; pass: string }): nodemailer.Transporter {
  const cacheKey = `${cfg.user}@${cfg.host}:${cfg.port}`;
  let transport = transportCache.get(cacheKey);
  if (!transport) {
    transport = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    transportCache.set(cacheKey, transport);
  }
  return transport;
}

const FALLBACK_TEMPLATES: Record<string, TemplateConfig> = {
  appointment_created_doctor: {
    subject: 'Nouveau rendez-vous - {{patientFirstName}} {{patientLastName}}',
    body: `<h2>Nouveau rendez-vous programmé</h2>
<p>Un nouveau rendez-vous a été programmé pour <strong>{{patientFirstName}} {{patientLastName}}</strong>.</p>
<p><strong>Date :</strong> {{appointmentDate}} à {{appointmentTime}}</p>
<p><strong>Type :</strong> {{appointmentType}}</p>`,
  },
  appointment_created_patient: {
    subject: 'Votre rendez-vous a été programmé - GyneCare',
    body: `<h2>Confirmation de rendez-vous</h2>
<p>Bonjour {{patientFirstName}} {{patientLastName}},</p>
<p>Votre rendez-vous avec le Dr {{doctorFirstName}} {{doctorLastName}} a été programmé.</p>
<p><strong>Date :</strong> {{appointmentDate}} à {{appointmentTime}}</p>
<p><strong>Cabinet :</strong> {{clinicName}}{{clinicAddress}}</p>`,
  },
  appointment_status_changed: {
    subject: 'Mise à jour de votre rendez-vous - GyneCare',
    body: `<h2>Mise à jour du statut</h2>
<p>Le statut de votre rendez-vous pour <strong>{{patientFirstName}} {{patientLastName}}</strong> est passé à <strong>{{appointmentStatus}}</strong>.</p>
<p><strong>Date :</strong> {{appointmentDate}} à {{appointmentTime}}</p>`,
  },
  appointment_modified_doctor: {
    subject: 'Rendez-vous modifié - {{patientFirstName}} {{patientLastName}}',
    body: `<h2>Rendez-vous modifié</h2>
<p>Le rendez-vous de <strong>{{patientFirstName}} {{patientLastName}}</strong> a été modifié.</p>
<p><strong>Nouvelle date :</strong> {{appointmentDate}} à {{appointmentTime}}</p>
<p><strong>Raison :</strong> {{appointmentReason}}</p>`,
  },
  unavailable_slot_created: {
    subject: 'Nouvelle indisponibilité - Dr {{doctorLastName}}',
    body: `<h2>Nouveau créneau d'indisponibilité</h2>
<p>Le Dr <strong>{{doctorFirstName}} {{doctorLastName}}</strong> a ajouté un créneau d'indisponibilité.</p>
<p><strong>Date :</strong> {{appointmentDate}} de {{appointmentTime}}</p>
<p><strong>Motif :</strong> {{reason}}</p>`,
  },
  reminder_patient: {
    subject: 'Rappel : Votre rendez-vous demain - GyneCare',
    body: `<h2>Rappel de rendez-vous</h2>
<p>Bonjour {{patientFirstName}} {{patientLastName}},</p>
<p>Nous vous rappelons votre rendez-vous avec le Dr {{doctorFirstName}} {{doctorLastName}}.</p>
<p><strong>Date :</strong> {{appointmentDate}} à {{appointmentTime}}</p>
<p><strong>Cabinet :</strong> {{clinicName}}{{clinicAddress}}</p>
<p>En cas d'indisponibilité, merci de nous contacter.</p>`,
  },
};

function getDefaultTemplate(key: string): TemplateConfig | undefined {
  return FALLBACK_TEMPLATES[key];
}

function getTemplate(key: string): TemplateConfig | undefined {
  const templates = getTemplates();
  return templates[key] || getDefaultTemplate(key);
}

export async function sendTemplateEmail(
  doctorId: string,
  to: string,
  templateKey: string,
  context: TemplateContext,
): Promise<boolean> {
  try {
    const template = getTemplate(templateKey);
    if (!template) {
      console.error(`[NOTIFICATION] Template "${templateKey}" non trouvé`);
      return false;
    }

    const cfg = await getSmtpConfigForDoctor(doctorId);
    if (!cfg) {
      console.error('[NOTIFICATION] Aucune configuration SMTP pour le médecin', doctorId);
      return false;
    }

    const subject = renderTemplate(template.subject, context);
    const html = renderTemplate(buildEmailHtml(template.body), context);

    const transport = getTransporter(doctorId, cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`[NOTIFICATION] Email "${templateKey}" envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error(`[NOTIFICATION] Erreur envoi "${templateKey}" à ${to}:`, err);
    return false;
  }
}

function buildEmailHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f7f9}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#1a5c4a,#2d7a64);padding:30px;text-align:center}
.header h1{color:#fff;margin:0;font-size:28px}.header p{color:#a5d6c6;margin:8px 0 0;font-size:14px}
.content{padding:35px 30px}
.content h2{color:#1a5c4a;font-size:20px;margin-top:0}
.content p{color:#555;font-size:15px;line-height:1.6;margin-bottom:10px}
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}.footer p{color:#999;font-size:13px;margin:4px 0}
</style></head><body>
<div class="container">
  <div class="header"><h1>GyneCare</h1><p>Cabinet médical</p></div>
  <div class="content">${body}</div>
  <div class="footer"><p>GyneCare - Cabinet Médical</p><p>Email automatique, merci de ne pas répondre.</p></div>
</div>
</body></html>`;
}

export function getReminderTimings(): number[] {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (Array.isArray(config.reminderTimings)) {
        const valid = config.reminderTimings.filter((v: any) => typeof v === 'number' && v >= 1 && v <= 168);
        if (valid.length > 0) return valid;
      }
      // Migration depuis l'ancien format single value
      if (config.reminderTimingHours) {
        const val = parseInt(config.reminderTimingHours, 10);
        if (!isNaN(val) && val > 0) return [val];
      }
    }
  } catch { /* ignore */ }
  return [24];
}

export async function sendDoctorEmail(doctorId: string, templateKey: string, context: TemplateContext) {
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { email: true, firstName: true, lastName: true },
  });
  if (!doctor?.email) return false;
  return sendTemplateEmail(doctorId, doctor.email, templateKey, {
    ...context,
    doctorFirstName: doctor.firstName,
    doctorLastName: doctor.lastName,
    doctorEmail: doctor.email,
  });
}

export async function sendPatientEmail(patientId: string, doctorId: string, templateKey: string, context: TemplateContext) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });
  if (!patient?.user?.email) return false;
  return sendTemplateEmail(doctorId, patient.user.email, templateKey, {
    ...context,
    patientFirstName: patient.user.firstName,
    patientLastName: patient.user.lastName,
    patientEmail: patient.user.email,
  });
}

export async function sendSecretaryEmail(doctorId: string, templateKey: string, context: TemplateContext) {
  const secretaries = await prisma.user.findMany({
    where: { role: 'SECRETARY', doctorId, isActive: true },
    select: { email: true, firstName: true, lastName: true },
  });
  if (secretaries.length === 0) return false;
  const results = await Promise.allSettled(
    secretaries.map(s =>
      sendTemplateEmail(doctorId, s.email, templateKey, {
        ...context,
        secretaryFirstName: s.firstName,
        secretaryLastName: s.lastName,
      })
    )
  );
  return results.some(r => r.status === 'fulfilled' && r.value);
}

export async function sendTestEmail(doctorId: string, to: string, templateKey: string, context: TemplateContext): Promise<boolean> {
  return sendTemplateEmail(doctorId, to, templateKey, context);
}

export { getTemplates, getDefaultTemplate, FALLBACK_TEMPLATES };
