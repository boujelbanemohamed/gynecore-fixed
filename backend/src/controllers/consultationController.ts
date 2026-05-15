import { Request, Response } from 'express';
import { ConsultationType, AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';

const createConsultationSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  date: z.string().min(1, 'Date requise'),
  type: z.nativeEnum(ConsultationType).optional(),
  chiefComplaint: z.string().optional(),
  symptoms: z.string().optional(),
  clinicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.number().min(30).max(45).optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  generalState: z.string().optional(),
  ddr: z.string().optional(),
  examDetails: z.record(z.any()).optional(),
  nextVisit: z.string().optional(),
  isConfidential: z.boolean().optional(),
});

const updateConsultationSchema = z.object({
  date: z.string().optional(),
  type: z.nativeEnum(ConsultationType).optional(),
  chiefComplaint: z.string().optional(),
  symptoms: z.string().optional(),
  clinicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.number().min(30).max(45).optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  generalState: z.string().optional(),
  ddr: z.string().optional(),
  examDetails: z.record(z.any()).optional(),
  nextVisit: z.string().optional(),
  isConfidential: z.boolean().optional(),
});

export const getConsultations = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const patientId = req.query.patientId as string;
    const type = req.query.type as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build where clause
    const and: Record<string, unknown>[] = [{ patient: { doctorId } }, { status: { not: 'CANCELLED' } }];

    if (patientId) and.push({ patientId });
    if (type) and.push({ type });
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      and.push({ date: dateFilter });
    }
    if (search) {
      and.push({
        OR: [
          { patient: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
          { patient: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
          { diagnosis: { contains: search, mode: 'insensitive' } } as Record<string, unknown>,
          { chiefComplaint: { contains: search, mode: 'insensitive' } } as Record<string, unknown>,
        ],
      });
    }

    const consultations = await prisma.consultation.findMany({
      where: { AND: and },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
      orderBy: { date: 'desc' },
      take: limit,
    });
    return res.json({ success: true, data: { consultations } });
  } catch (err) {
    console.error('[getConsultations] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createConsultation = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const data = createConsultationSchema.parse(req.body);

    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, doctorId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patiente non trouvee' });

    const consultation = await prisma.consultation.create({
      data: {
        patientId: data.patientId,
        date: new Date(data.date),
        type: data.type,
        chiefComplaint: data.chiefComplaint,
        symptoms: data.symptoms,
        clinicalExam: data.clinicalExam,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes: data.notes,
        weight: data.weight,
        height: data.height,
        bloodPressure: data.bloodPressure,
        temperature: data.temperature,
        heartRate: data.heartRate,
        generalState: data.generalState,
        ddr: data.ddr ? new Date(data.ddr) : undefined,
        examDetails: data.examDetails,
        nextVisit: data.nextVisit ? new Date(data.nextVisit) : undefined,
        isConfidential: data.isConfidential,
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: consultation });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[createConsultation] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const data = updateConsultationSchema.parse(req.body);

    const consultation = await prisma.consultation.findFirst({
      where: { id, patient: { doctorId } },
    });
    if (!consultation) return res.status(404).json({ success: false, error: 'Consultation non trouvee' });
    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        ddr: data.ddr ? new Date(data.ddr) : undefined,
        nextVisit: data.nextVisit ? new Date(data.nextVisit) : undefined,
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[updateConsultation] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const consultation = await prisma.consultation.findFirst({
      where: { id, patient: { doctorId } },
    });
    if (!consultation) return res.status(404).json({ success: false, error: 'Consultation non trouvee' });
    await prisma.consultation.delete({ where: { id } });
    return res.json({ success: true, data: null });
  } catch (err) {
    console.error('[deleteConsultation] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const cancelConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;

    const consultation = await prisma.consultation.findFirst({
      where: { id, patient: { doctorId } },
      include: { appointment: { select: { id: true, status: true } } },
    });
    if (!consultation) return res.status(404).json({ success: false, error: 'Consultation non trouvee' });
    if (consultation.status === 'CANCELLED') return res.status(400).json({ success: false, error: 'Consultation deja annulee' });

    await prisma.consultation.update({ where: { id }, data: { status: 'CANCELLED' } });

    // Annuler le RDV lie si toujours actif
    if (consultation.appointment && consultation.appointment.status !== 'CANCELLED') {
      await prisma.appointment.update({
        where: { id: consultation.appointment.id },
        data: { status: AppointmentStatus.CANCELLED },
      });
    }

    return res.json({ success: true, data: null });
  } catch (err) {
    console.error('[cancelConsultation] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
