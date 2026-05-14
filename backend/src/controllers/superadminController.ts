import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'system-config.json');

function readSystemConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function writeSystemConfig(config: Record<string, string>) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, totalConsultations, recentLogs] = await Promise.all([
      prisma.user.count({ where: { role: Role.DOCTOR, isActive: true } }),
      prisma.patient.count({ where: { isArchived: false } }),
      prisma.appointment.count(),
      prisma.consultation.count(),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    res.json({ success: true, data: { totalDoctors, totalPatients, totalAppointments, totalConsultations, recentLogs } });
  } catch (err) {
    console.error('[superadmin dashboard]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, licenseNumber: true, specialization: true, isActive: true, createdAt: true, clinicName: true, address: true, city: true },
      orderBy: { createdAt: 'desc' },
    });
    const withStats = await Promise.all(doctors.map(async (d) => {
      const secretaries = await prisma.user.findMany({
        where: { role: Role.SECRETARY, doctorId: d.id },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      return {
        ...d,
        patientsCount: await prisma.patient.count({ where: { doctorId: d.id } }),
        appointmentsCount: await prisma.appointment.count({ where: { doctorId: d.id } }),
        secretaries,
        secretariesCount: secretaries.length,
      };
    }));
    res.json({ success: true, data: withStats });
  } catch (err) {
    console.error('[superadmin getDoctors]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, licenseNumber, specialization, clinicName } = req.body;
    if (!email || !password || !firstName || !lastName) return res.status(400).json({ success: false, error: 'Champs requis manquants' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email deja utilise' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, firstName, lastName, phone, role: Role.DOCTOR, licenseNumber, specialization, clinicName, isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, licenseNumber: true, specialization: true, clinicName: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error('[superadmin createDoctor]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, licenseNumber, specialization, isActive, clinicName } = req.body;
    const existing = await prisma.user.findFirst({ where: { id, role: Role.DOCTOR } });
    if (!existing) return res.status(404).json({ success: false, error: 'Medecin non trouve' });
    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email } });
      if (conflict) return res.status(409).json({ success: false, error: 'Email deja utilise' });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { email, firstName, lastName, phone, licenseNumber, specialization, isActive, clinicName },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, licenseNumber: true, specialization: true, isActive: true, clinicName: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[superadmin updateDoctor]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const resetDoctorPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findFirst({ where: { id, role: Role.DOCTOR } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Medecin non trouve' });
    const tempPassword = crypto.randomBytes(6).toString('hex') + crypto.randomBytes(3).toString('hex').toUpperCase();
    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(tempPassword, 10) } });
    res.json({ success: true, data: { tempPassword } });
  } catch (err) {
    console.error('[superadmin resetDoctorPassword]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const resetSecretaryPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const secretary = await prisma.user.findFirst({ where: { id, role: Role.SECRETARY } });
    if (!secretary) return res.status(404).json({ success: false, error: 'Secretaire non trouvee' });
    const tempPassword = crypto.randomBytes(6).toString('hex') + crypto.randomBytes(3).toString('hex').toUpperCase();
    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(tempPassword, 10) } });
    res.json({ success: true, data: { tempPassword } });
  } catch (err) {
    console.error('[superadmin resetSecretaryPassword]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const toggleSecretaryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const secretary = await prisma.user.findFirst({ where: { id, role: Role.SECRETARY } });
    if (!secretary) return res.status(404).json({ success: false, error: 'Secretaire non trouvee' });
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !secretary.isActive },
      select: { id: true, isActive: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[superadmin toggleSecretaryStatus]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('[superadmin getAllUsers]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getAllAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    const logsWithUser = await Promise.all(logs.map(async (log) => {
      const u = await prisma.user.findUnique({ where: { id: log.userId }, select: { email: true, firstName: true, lastName: true, role: true } });
      return { ...log, user: u };
    }));
    res.json({ success: true, data: { logs: logsWithUser, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[superadmin getAllAuditLogs]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getSystemSettings = async (_req: Request, res: Response) => {
  try {
    const fileConfig = readSystemConfig();
    const envInfo: Record<string, string> = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
      JWT_PATIENT_EXPIRES_IN: process.env.JWT_PATIENT_EXPIRES_IN || '7d',
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || '',
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'GyneCare',
      SMTP_USER: process.env.SMTP_USER || '',
      SMTP_PASS: process.env.SMTP_PASS || '',
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '20',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    };
    Object.keys(fileConfig).forEach((k) => { if (envInfo[k] !== undefined) envInfo[k] = fileConfig[k]; });
    const dbInfo = await prisma.$queryRaw`SELECT version() as version`;
    res.json({ success: true, data: { env: envInfo, db: dbInfo } });
  } catch (err) {
    console.error('[superadmin getSystemSettings]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Donnees invalides' });
    }
    const allowedKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM_EMAIL', 'SMTP_FROM_NAME', 'SMTP_USER', 'SMTP_PASS',
      'CORS_ORIGIN', 'FRONTEND_URL', 'JWT_EXPIRES_IN', 'JWT_PATIENT_EXPIRES_IN',
      'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'];
    const current = readSystemConfig();
    for (const key of allowedKeys) {
      if (settings[key] !== undefined) current[key] = String(settings[key]);
    }
    writeSystemConfig(current);
    res.json({ success: true, message: 'Configuration sauvegardee. Redemarrez le serveur pour appliquer les changements.' });
  } catch (err) {
    console.error('[superadmin updateSystemSettings]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getSystemHealth = async (_req: Request, res: Response) => {
  try {
    const start = Date.now();

    let dbStatus = 'ok';
    let dbResponseTime = 0;
    let dbVersion = '';
    try {
      const dbStart = Date.now();
      const result = await prisma.$queryRaw`SELECT version() as version`;
      dbResponseTime = Date.now() - dbStart;
      dbVersion = String((result as any[])[0]?.version || '');
    } catch {
      dbStatus = 'error';
    }

    let configStatus = 'ok';
    let configSize = 0;
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        configSize = fs.statSync(CONFIG_PATH).size;
      } else {
        configStatus = 'missing';
      }
    } catch {
      configStatus = 'error';
    }

    const config = readSystemConfig();
    const smtpConfigured = !!(config.SMTP_HOST || process.env.SMTP_HOST);
    const smtpHost = (config.SMTP_HOST || process.env.SMTP_HOST || '').replace(/^(.{3}).*(@.*)$/, '$1***$2');

    const totalResponseTime = Date.now() - start;

    res.json({
      success: true,
      data: {
        checks: {
          backend: {
            status: 'ok',
            uptime: Math.floor(process.uptime()),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            platform: process.platform,
            memoryUsage: {
              heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            },
            responseTime: totalResponseTime,
          },
          database: {
            status: dbStatus,
            responseTime: dbResponseTime,
            version: dbVersion,
          },
          systemConfig: {
            status: configStatus,
            path: CONFIG_PATH,
            size: configSize,
          },
          smtp: {
            status: smtpConfigured ? 'ok' : 'warning',
            configured: smtpConfigured,
            host: smtpHost,
            fromName: config.SMTP_FROM_NAME || process.env.SMTP_FROM_NAME || 'GyneCare',
          },
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[superadmin health]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification de santé' });
  }
};

export const getDoctorPatients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findFirst({ where: { id, role: Role.DOCTOR } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Medecin non trouve' });
    const patients = await prisma.patient.findMany({
      where: { doctorId: id, isArchived: false },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true } },
        _count: { select: { appointments: true, consultations: true, prescriptions: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: patients });
  } catch (err) {
    console.error('[superadmin getDoctorPatients]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPatientDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true } },
        appointments: { orderBy: { startTime: 'desc' }, take: 10, include: { doctor: { select: { firstName: true, lastName: true } } } },
        consultations: { orderBy: { date: 'desc' }, take: 10 },
        prescriptions: { orderBy: { createdAt: 'desc' }, take: 10 },
        certificates: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouve' });
    res.json({ success: true, data: patient });
  } catch (err) {
    console.error('[superadmin getPatientDetail]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const resetPatientPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({ where: { id }, include: { user: true } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouve' });
    const tempPassword = crypto.randomBytes(6).toString('hex') + crypto.randomBytes(3).toString('hex').toUpperCase();
    await prisma.user.update({ where: { id: patient.userId }, data: { password: await bcrypt.hash(tempPassword, 10) } });
    res.json({ success: true, data: { tempPassword } });
  } catch (err) {
    console.error('[superadmin resetPatientPassword]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const changeSuperadminPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Champs requis manquants' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 8 caracteres' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.SUPERADMIN) {
      return res.status(403).json({ success: false, error: 'Acces refuse' });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, error: 'Mot de passe actuel incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ success: true, message: 'Mot de passe mis a jour avec succes' });
  } catch (err) {
    console.error('[superadmin changePassword]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
