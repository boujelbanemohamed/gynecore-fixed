import { Request, Response } from 'express';
import { AppointmentStatus, ConsultationType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';
import { checkSlotAvailability } from './unavailableSlotController';

// ── Schemas de validation ──────────────────────────────────────────

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  doctorId: z.string().min(1, 'doctorId requis'),
  startTime: z.string().min(1, 'startTime requis'),
  endTime: z.string().min(1, 'endTime requis'),
  type: z.nativeEnum(ConsultationType).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
  message: 'La date de fin doit être après la date de début',
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, { errorMap: () => ({ message: 'Statut invalide' }) }),
});

// ── Transitions de statut autorisées ───────────────────────────────
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]:  [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CONFIRMED]:  [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CANCELLED]:  [],
  [AppointmentStatus.COMPLETED]:  [],
  [AppointmentStatus.NO_SHOW]:    [],
  [AppointmentStatus.PENDING]:      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.ARRIVED]:     [AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.POSTPONED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.POSTPONED]:   [AppointmentStatus.SCHEDULED, AppointmentStatus.CANCELLED],
};

// ── Contrôleurs ────────────────────────────────────────────────────

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { start, end, patientId } = req.query;

    // Restreint aux rendez-vous du médecin connecté
    const where: Record<string, unknown> = { doctorId };
    if (start && end) where.startTime = { gte: new Date(start as string), lte: new Date(end as string) };
    if (patientId) where.patientId = patientId;
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        doctor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return res.json({ success: true, data: appointments });
  } catch (err) {
    console.error('[getAppointments] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const data = createAppointmentSchema.parse(req.body);

    // Vérification de conflit d'horaire pour le médecin
    const conflicting = await prisma.appointment.count({
      where: {
        doctorId: data.doctorId,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        startTime: { lt: new Date(data.endTime) },
        endTime: { gt: new Date(data.startTime) },
      },
    });
    if (conflicting > 0) {
      return res.status(409).json({
        success: false,
        error: 'Un rendez-vous existe déjà sur ce créneau horaire pour ce médecin',
      });
    }

    // Vérifier la disponibilité du créneau
    const isAvailable = await checkSlotAvailability(data.doctorId, new Date(data.startTime), new Date(data.endTime));
    if (!isAvailable) {
      return res.status(409).json({ success: false, message: 'Ce créneau est indisponible. Veuillez choisir un autre horaire.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });
    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[createAppointment] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const { status } = updateStatusSchema.parse(req.body);

    // Vérifie que le RDV appartient à ce médecin
    const current = await prisma.appointment.findFirst({ where: { id, doctorId } });
    if (!current) return res.status(404).json({ success: false, error: 'Rendez-vous non trouvé' });

    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Transition de statut non autorisée : ${current.status} → ${status}`,
      });
    }

    const appointment = await prisma.appointment.update({ where: { id }, data: { status } });
    return res.json({ success: true, data: appointment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[updateAppointmentStatus] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouvé' });
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: { select: { firstName: true, lastName: true } } },
      orderBy: { startTime: 'desc' },
    });
    return res.json({ success: true, data: appointments });
  } catch (err) {
    console.error('[getPatientAppointments] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
