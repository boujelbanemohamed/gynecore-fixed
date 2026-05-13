import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const createMedicalLetterSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  date: z.string().optional(),
  type: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  recipient: z.string().optional(),
  recipientName: z.string().optional(),
  recipientAddress: z.string().optional(),
  cc: z.string().optional(),
  notes: z.string().optional(),
});

export const getMedicalLetters = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const patientId = req.query.patientId as string;
    const where: any = { patient: { doctorId } };
    if (patientId) where.patientId = patientId;
    const letters = await prisma.medicalLetter.findMany({
      where,
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: letters });
  } catch (err) {
    console.error('[getMedicalLetters] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMedicalLetterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const letter = await prisma.medicalLetter.findFirst({
      where: { id, patient: { doctorId } },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } },
    });
    if (!letter) return res.status(404).json({ success: false, error: 'Lettre non trouvee' });
    return res.json({ success: true, data: letter });
  } catch (err) {
    console.error('[getMedicalLetterById] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createMedicalLetter = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const data = createMedicalLetterSchema.parse(req.body);
    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, doctorId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patiente non trouvee' });
    const letter = await prisma.medicalLetter.create({
      data: {
        patientId: data.patientId,
        date: data.date ? new Date(data.date) : new Date(),
        type: data.type,
        subject: data.subject,
        content: data.content,
        recipient: data.recipient,
        recipientName: data.recipientName,
        recipientAddress: data.recipientAddress,
        cc: data.cc,
        notes: data.notes,
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: letter });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message });
    console.error('[createMedicalLetter] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateMedicalLetter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const data = createMedicalLetterSchema.partial().parse(req.body);
    const existing = await prisma.medicalLetter.findFirst({ where: { id, patient: { doctorId } } });
    if (!existing) return res.status(404).json({ success: false, error: 'Lettre non trouvee' });
    const letter = await prisma.medicalLetter.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.json({ success: true, data: letter });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message });
    console.error('[updateMedicalLetter] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteMedicalLetter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const existing = await prisma.medicalLetter.findFirst({ where: { id, patient: { doctorId } } });
    if (!existing) return res.status(404).json({ success: false, error: 'Lettre non trouvee' });
    await prisma.medicalLetter.delete({ where: { id } });
    return res.json({ success: true, message: 'Lettre supprimee' });
  } catch (err) {
    console.error('[deleteMedicalLetter] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
