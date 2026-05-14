import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

const transportCache = new Map<string, nodemailer.Transporter>();

async function getSmtpConfigForDoctor(doctorId: string) {
  const config = await prisma.smtpConfig.findUnique({ where: { doctorId } });
  if (config && config.enabled) {
    return {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      user: config.smtpUser,
      pass: config.smtpPass,
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

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const envUser = process.env.SMTP_USER || '';
    const envPass = process.env.SMTP_PASS || '';
    if (!envUser || !envPass) return false;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: envUser, pass: envPass },
    });
    await transport.verify();
    return true;
  } catch { return false; }
}

async function sendEmail(doctorId: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const cfg = await getSmtpConfigForDoctor(doctorId);
    if (!cfg) {
      console.error('[EMAIL] Aucune configuration SMTP pour le medecin', doctorId);
      return false;
    }
    const transport = getTransporter(doctorId, cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to, subject, html,
    });
    console.log(`[EMAIL] Email envoye a ${to} : "${subject}"`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi a ${to}:`, err);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string, doctorId?: string): Promise<boolean> {
  const fallbackId = doctorId || '__env__';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f7f9}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#e91e63,#c2185b);padding:30px;text-align:center}
.header h1{color:#fff;margin:0;font-size:28px}.header p{color:#ffcdd2;margin:8px 0 0;font-size:14px}
.content{padding:35px 30px}.content h2{color:#333;font-size:22px;margin-top:0}
.content p{color:#555;font-size:16px;line-height:1.6;margin-bottom:20px}
.btn{display:inline-block;background:linear-gradient(135deg,#e91e63,#c2185b);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;margin:10px 0 25px}
.warning{background:#fff3e0;border-left:4px solid #ff9800;padding:12px 16px;margin:20px 0;border-radius:4px}
.warning p{color:#e65100;font-size:14px;margin:0}
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}.footer p{color:#999;font-size:13px;margin:4px 0}
</style></head><body>
<div class="container">
  <div class="header"><h1>GyneCare</h1><p>Gestion de cabinet medical</p></div>
  <div class="content">
    <h2>Reinitialisation de votre mot de passe</h2>
    <p>Bonjour,</p>
    <p>Vous avez demande la reinitialisation de votre mot de passe. Cliquez ci-dessous :</p>
    <a href="${resetUrl}" class="btn">Reinitialiser mon mot de passe</a>
    <p>Ou copiez ce lien : <span style="word-break:break-all;color:#e91e63;font-size:14px;">${resetUrl}</span></p>
    <div class="warning"><p>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p></div>
    <p>Cordialement,<br>L'equipe GyneCare</p>
  </div>
  <div class="footer"><p>GyneCare - Cabinet Medical</p><p>Email automatique, merci de ne pas repondre.</p></div>
</div>
</body></html>`;
  return sendEmail(fallbackId, to, 'GyneCare - Reinitialisation de votre mot de passe', html);
}

export async function sendAppointmentConfirmationEmail(doctorId: string, to: string, data: {
  patientFirstName: string; patientLastName: string;
  doctorFirstName: string; doctorLastName: string;
  date: string; time: string; type: string;
  clinicName?: string | null; clinicAddress?: string | null;
}): Promise<boolean> {
  const labels: Record<string,string> = {
    FIRST_VISIT:'Premiere visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
    ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Suivi prenatal', POSTNATAL:'Suivi postnatal',
  };
  const typeLabel = labels[data.type] || data.type;
  const clinicLine = data.clinicName
    ? `<p style="color:#777;font-size:15px"><strong>Lieu :</strong> ${data.clinicName}${data.clinicAddress ? ' - ' + data.clinicAddress : ''}</p>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f7f9}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#43a047,#2e7d32);padding:30px;text-align:center}
.header h1{color:#fff;margin:0;font-size:28px}.header p{color:#c8e6c9;margin:8px 0 0;font-size:14px}
.content{padding:35px 30px}.content h2{color:#333;font-size:22px;margin-top:0}
.content p{color:#555;font-size:16px;line-height:1.6;margin-bottom:10px}
.info-box{background:#e8f5e9;border-radius:8px;padding:20px;margin:20px 0}
.info-row{display:flex;margin-bottom:10px}.info-label{color:#2e7d32;font-weight:600;min-width:130px;font-size:15px}
.info-value{color:#333;font-size:15px}
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}.footer p{color:#999;font-size:13px;margin:4px 0}
</style></head><body>
<div class="container">
  <div class="header"><h1>GyneCare</h1><p>Rendez-vous confirme</p></div>
  <div class="content">
    <h2>Votre rendez-vous est confirme</h2>
    <p>Bonjour ${data.patientFirstName} ${data.patientLastName},</p>
    <p>Votre rendez-vous a bien ete confirme par le Dr ${data.doctorFirstName} ${data.doctorLastName}.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Date :</span><span class="info-value">${data.date}</span></div>
      <div class="info-row"><span class="info-label">Heure :</span><span class="info-value">${data.time}</span></div>
      <div class="info-row"><span class="info-label">Type :</span><span class="info-value">${typeLabel}</span></div>
      <div class="info-row"><span class="info-label">Medecin :</span><span class="info-value">Dr ${data.doctorFirstName} ${data.doctorLastName}</span></div>
    </div>
    ${clinicLine}
    <p>En cas d'indisponibilite, contactez-nous pour annuler ou reprogrammer.</p>
    <p>Cordialement,<br>L'equipe GyneCare</p>
  </div>
  <div class="footer"><p>GyneCare - Cabinet Medical</p><p>Email automatique, merci de ne pas repondre.</p></div>
</div>
</body></html>`;
  return sendEmail(doctorId, to, 'GyneCare - Rendez-vous confirme', html);
}

export async function sendAppointmentCancellationEmail(doctorId: string, to: string, data: {
  patientFirstName: string; patientLastName: string;
  doctorFirstName: string; doctorLastName: string;
  date: string; time: string;
}): Promise<boolean> {
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f7f9}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#e53935,#c62828);padding:30px;text-align:center}
.header h1{color:#fff;margin:0;font-size:28px}
.content{padding:35px 30px}.content h2{color:#333;font-size:22px;margin-top:0}
.content p{color:#555;font-size:16px;line-height:1.6;margin-bottom:15px}
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}.footer p{color:#999;font-size:13px;margin:4px 0}
</style></head><body>
<div class="container">
  <div class="header"><h1>GyneCare</h1></div>
  <div class="content">
    <h2>Rendez-vous annule</h2>
    <p>Bonjour ${data.patientFirstName} ${data.patientLastName},</p>
    <p>Votre rendez-vous du <strong>${data.date} a ${data.time}</strong> avec le Dr ${data.doctorFirstName} ${data.doctorLastName} a ete annule.</p>
    <p>Si vous souhaitez reprogrammer, veuillez prendre contact avec le cabinet.</p>
    <p>Cordialement,<br>L'equipe GyneCare</p>
  </div>
  <div class="footer"><p>GyneCare - Cabinet Medical</p><p>Email automatique, merci de ne pas repondre.</p></div>
</div>
</body></html>`;
  return sendEmail(doctorId, to, 'GyneCare - Rendez-vous annule', html);
}
