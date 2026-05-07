import { Request, Response } from 'express';
import { Role, AppointmentStatus, ConsultationType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';

// ── Schemas de validation Zod ──────────────────────────────────────

const createPatientSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'La date de naissance est requise'),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  familyHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  lastMenstrualPeriod: z.string().optional(),
  contraceptionMethod: z.string().optional(),
  numberOfPregnancies: z.number().int().min(0).optional(),
  numberOfDeliveries: z.number().int().min(0).optional(),
});

const updatePatientSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  contraceptionMethod: z.string().optional(),
  numberOfPregnancies: z.number().int().min(0).optional(),
  numberOfDeliveries: z.number().int().min(0).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  familyHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  lastMenstrualPeriod: z.string().optional(),
});

// ── Helpers ────────────────────────────────────────────────────────

function formatZodError(err: unknown): string {
  if (err instanceof z.ZodError) return err.errors[0].message;
  return 'Erreur de validation';
}

// ── Contrôleurs ────────────────────────────────────────────────────

export const getPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // Filtre par médecin + exclut les patients archivés
    const baseWhere = { doctorId, isArchived: false };
    const where = search ? {
      ...baseWhere,
      OR: [
        { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
        { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    } : baseWhere;

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where, skip, take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          _count: { select: { consultations: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);
    return res.json({
      success: true,
      data: { patients, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    console.error('[getPatients] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const patient = await prisma.patient.findFirst({
      where: { id, doctorId }, // Vérifie l'appartenance au médecin
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        consultations: { orderBy: { date: 'desc' }, take: 20 },
        prescriptions: { orderBy: { date: 'desc' }, take: 20 },
        appointments: { orderBy: { startTime: 'desc' }, take: 20 },
        documents: true,
      },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patiente non trouvée' });
    return res.json({ success: true, data: patient });
  } catch (err) {
    console.error('[getPatientById] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const data = createPatientSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(
      data.password || `Patient-${Date.now().toString(36)}!`,
      12,
    );
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: Role.PATIENT,
        patient: {
          create: {
            doctorId: req.user!.userId, // Associé au médecin créateur
            dateOfBirth: new Date(data.dateOfBirth),
            bloodType: data.bloodType,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country || undefined,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            allergies: data.allergies,
            chronicDiseases: data.chronicDiseases,
            familyHistory: data.familyHistory,
            currentMedications: data.currentMedications,
            lastMenstrualPeriod: data.lastMenstrualPeriod ? new Date(data.lastMenstrualPeriod) : undefined,
            contraceptionMethod: data.contraceptionMethod,
            numberOfPregnancies: data.numberOfPregnancies || 0,
            numberOfDeliveries: data.numberOfDeliveries || 0,
          },
        },
      },
      include: { patient: true },
    });
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: formatZodError(err) });
    }
    console.error('[createPatient] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const data = updatePatientSchema.parse(req.body);
    const { email, firstName, lastName, phone, dateOfBirth, lastMenstrualPeriod, ...patientData } = data;

    // Vérifie que le patient appartient bien à ce médecin
    const existing = await prisma.patient.findFirst({ where: { id, doctorId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Patiente non trouvée' });

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        lastMenstrualPeriod: lastMenstrualPeriod !== undefined ? (lastMenstrualPeriod ? new Date(lastMenstrualPeriod) : null) : undefined,
        user: {
          update: {
            ...(email && { email }),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone !== undefined && { phone }),
          },
        },
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } },
    });
    return res.json({ success: true, data: patient });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: formatZodError(err) });
    }
    console.error('[updatePatient] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Soft delete : archive la patiente sans la supprimer de la BDD
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;

    const existing = await prisma.patient.findFirst({ where: { id, doctorId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Patiente non trouvée' });

    await prisma.patient.update({ where: { id }, data: { isArchived: true } });
    return res.json({ success: true, message: 'Patiente archivée' });
  } catch (err) {
    console.error('[deletePatient] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalPatients, todayAppointments, monthConsultations, pendingAppointments] = await Promise.all([
      prisma.patient.count({ where: { doctorId, isArchived: false } }),
      prisma.appointment.count({ where: { doctorId, startTime: { gte: startOfDay, lte: endOfDay } } }),
      prisma.consultation.count({ where: { patient: { doctorId }, date: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { doctorId, status: AppointmentStatus.SCHEDULED } }),
    ]);
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { startTime: 'asc' },
      take: 5,
    });
    return res.json({
      success: true,
      data: { stats: { totalPatients, todayAppointments, monthConsultations, pendingAppointments }, upcomingAppointments },
    });
  } catch (err) {
    console.error('[getDashboardStats] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
