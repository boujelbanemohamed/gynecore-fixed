import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { decrypt } from './encryption';

const transportCache = new Map<string, nodemailer.Transporter>();

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export async function getSmtpConfigForDoctor(doctorId: string): Promise<SmtpConfig | null> {
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

export function getTransporter(cfg: { host: string; port: number; secure: boolean; user: string; pass: string }): nodemailer.Transporter {
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
