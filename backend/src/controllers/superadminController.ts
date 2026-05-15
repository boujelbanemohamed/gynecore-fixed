import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import * as healthService from '../services/healthAutoRecoveryService';

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
      prisma.auditLog.findMany({
        where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
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
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        licenseNumber: true, specialization: true, isActive: true, createdAt: true,
        clinicName: true, address: true, city: true,
        _count: { select: { managedPatients: true, appointments: true, secretaries: true } },
        secretaries: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const withStats = doctors.map(d => {
      const { _count, secretaries, ...rest } = d;
      return { ...rest, patientsCount: _count.managedPatients, appointmentsCount: _count.appointments, secretaries, secretariesCount: _count.secretaries };
    });
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
    const userIds = [...new Set(logs.map(l => l.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    const logsWithUser = logs.map(log => ({ ...log, user: userMap.get(log.userId) || null }));
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
      SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/^(.{2}).*(@.*)$/, '$1***$2') : '',
      SMTP_PASS: process.env.SMTP_PASS ? '********' : '',
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '20',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      GOOGLE_CALENDAR_SYNC_INTERVAL: process.env.GOOGLE_CALENDAR_SYNC_INTERVAL || '300',
      HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL || '30',
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
      'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX',
      'GOOGLE_CALENDAR_SYNC_INTERVAL', 'HEALTH_CHECK_INTERVAL'];
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
    const checks = await healthService.runFullCheck();

    const backendCheck = checks.find(c => c.component === 'backend')!;
    const frontendCheck = checks.find(c => c.component === 'frontend')!;
    const dbCheck = checks.find(c => c.component === 'database')!;
    const configCheck = checks.find(c => c.component === 'config')!;
    const smtpCheck = checks.find(c => c.component === 'smtp')!;
    const gcCheck = checks.find(c => c.component === 'googleCalendar')!;
    const authCheck = checks.find(c => c.component === 'auth');
    const storageCheck = checks.find(c => c.component === 'storage');
    const remindersCheck = checks.find(c => c.component === 'reminders');
    const securityCheck = checks.find(c => c.component === 'security');

    const config = readSystemConfig();
    const smtpHost = (config.SMTP_HOST || process.env.SMTP_HOST || '').replace(/^(.{3}).*(@.*)$/, '$1***$2');

    const configSize = fs.existsSync(CONFIG_PATH) ? fs.statSync(CONFIG_PATH).size : 0;

    let gcTotal = 0, gcConnectedDoctors = 0;
    const gcDoctors: {id: string; email: string; name: string}[] = [];
    try {
      const tokens = await prisma.googleCalendarToken.findMany({
        select: { doctorId: true, doctor: { select: { email: true, firstName: true, lastName: true } } }
      });
      gcTotal = tokens.length;
      gcConnectedDoctors = tokens.length;
      for (const t of tokens) {
        gcDoctors.push({ id: t.doctorId, email: t.doctor.email, name: `${t.doctor.firstName} ${t.doctor.lastName}` });
      }
    } catch { /* table may not exist */ }

    const totalResponseTime = Date.now() - start;

    res.json({
      success: true,
      data: {
        checks: {
          backend: {
            status: backendCheck.status,
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
            message: backendCheck.message,
            recoveryAction: backendCheck.recoveryAction,
            recoverySuccess: backendCheck.recoverySuccess,
          },
          database: {
            status: dbCheck.status,
            responseTime: dbCheck.durationMs,
            version: '',
            message: dbCheck.message,
            recoveryAction: dbCheck.recoveryAction,
            recoverySuccess: dbCheck.recoverySuccess,
          },
          systemConfig: {
            status: configCheck.status,
            path: CONFIG_PATH,
            size: configSize,
            message: configCheck.message,
            recoveryAction: configCheck.recoveryAction,
            recoverySuccess: configCheck.recoverySuccess,
          },
          smtp: {
            status: smtpCheck.status,
            configured: smtpCheck.status === 'ok',
            host: smtpHost,
            fromName: config.SMTP_FROM_NAME || process.env.SMTP_FROM_NAME || 'GyneCare',
            message: smtpCheck.message,
            recoveryAction: smtpCheck.recoveryAction,
            recoverySuccess: smtpCheck.recoverySuccess,
          },
          frontend: {
            status: frontendCheck.status,
            message: frontendCheck.message,
            durationMs: frontendCheck.durationMs,
            recoveryAction: frontendCheck.recoveryAction,
            recoverySuccess: frontendCheck.recoverySuccess,
          },
          googleCalendar: {
            status: gcCheck.status,
            connectedDoctors: gcConnectedDoctors,
            totalTokens: gcTotal,
            doctors: gcDoctors,
            message: gcCheck.message,
            recoveryAction: gcCheck.recoveryAction,
            recoverySuccess: gcCheck.recoverySuccess,
            disabled: gcCheck.disabled,
          },
          auth: {
            status: authCheck?.status || 'error',
            message: authCheck?.message || 'Non disponible',
            checkCommand: authCheck?.checkCommand,
            durationMs: authCheck?.durationMs || 0,
            recoveryAction: authCheck?.recoveryAction,
            recoverySuccess: authCheck?.recoverySuccess,
            disabled: authCheck?.disabled,
          },
          storage: {
            status: storageCheck?.status || 'error',
            message: storageCheck?.message || 'Non disponible',
            checkCommand: storageCheck?.checkCommand,
            durationMs: storageCheck?.durationMs || 0,
            recoveryAction: storageCheck?.recoveryAction,
            recoverySuccess: storageCheck?.recoverySuccess,
            disabled: storageCheck?.disabled,
          },
          reminders: {
            status: remindersCheck?.status || 'error',
            message: remindersCheck?.message || 'Non disponible',
            checkCommand: remindersCheck?.checkCommand,
            durationMs: remindersCheck?.durationMs || 0,
            recoveryAction: remindersCheck?.recoveryAction,
            recoverySuccess: remindersCheck?.recoverySuccess,
            disabled: remindersCheck?.disabled,
          },
          security: {
            status: securityCheck?.status || 'error',
            message: securityCheck?.message || 'Non disponible',
            checkCommand: securityCheck?.checkCommand,
            durationMs: securityCheck?.durationMs || 0,
            recoveryAction: securityCheck?.recoveryAction,
            recoverySuccess: securityCheck?.recoverySuccess,
            disabled: securityCheck?.disabled,
          },
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[superadmin health]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la verification de sante' });
  }
};

export const getHealthAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const component = req.query.component as string | undefined;
    const action = req.query.action as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const where: any = {};
    if (component) where.component = component;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.healthAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.healthAuditLog.count({ where }),
    ]);
    res.json({
      success: true,
      data: {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    console.error('[superadmin getHealthAuditLogs]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const toggleHealthComponent = async (req: Request, res: Response) => {
  try {
    const { component, enabled } = req.body;
    if (!component || !healthService.ALL_COMPONENTS.includes(component)) {
      return res.status(400).json({ success: false, error: 'Composant invalide' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled doit etre un booleen' });
    }
    const result = await healthService.toggleComponent(component, enabled);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[superadmin toggleHealthComponent]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const recoverHealthComponent = async (req: Request, res: Response) => {
  try {
    const { component } = req.params;
    if (!component || !(healthService.ALL_COMPONENTS as readonly string[]).includes(component)) {
      return res.status(400).json({ success: false, error: 'Composant invalide' });
    }
    const disabled = healthService.getDisabledComponents();
    if (disabled.has(component)) {
      return res.status(400).json({ success: false, error: 'Composant desactive, activez-le d\'abord' });
    }
    const result = await healthService.recoverComponent(component);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[superadmin recoverHealthComponent]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
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
