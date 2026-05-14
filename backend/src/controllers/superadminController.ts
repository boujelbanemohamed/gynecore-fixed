import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

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
    const withStats = await Promise.all(doctors.map(async (d) => ({
      ...d,
      patientsCount: await prisma.patient.count({ where: { doctorId: d.id } }),
      appointmentsCount: await prisma.appointment.count({ where: { doctorId: d.id } }),
    })));
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
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase();
    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(tempPassword, 10) } });
    res.json({ success: true, data: { tempPassword } });
  } catch (err) {
    console.error('[superadmin resetDoctorPassword]', err);
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
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.CORS_ORIGIN,
      jwtExpiry: process.env.JWT_EXPIRES_IN,
      patientJwtExpiry: process.env.JWT_PATIENT_EXPIRES_IN,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpFromEmail: process.env.SMTP_FROM_EMAIL,
      smtpFromName: process.env.SMTP_FROM_NAME,
    };
    const dbInfo = await prisma.$queryRaw`SELECT version() as version`;
    res.json({ success: true, data: { env: envInfo, db: dbInfo } });
  } catch (err) {
    console.error('[superadmin getSystemSettings]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
