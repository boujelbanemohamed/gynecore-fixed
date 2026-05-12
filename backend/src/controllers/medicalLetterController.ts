import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const createLetterSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  type: z.enum(['SPECIALIST_REFERRAL', 'EMPLOYER', 'MEDICAL_REPORT', 'DISCHARGE_SUMMARY', 'OTHER']),
  recipient: z.string().min(1, 'Destinataire requis'),
  subject: z.string().min(1, 'Objet requis'),
  content: z.record(z.unknown()).optional(),
});

export const getMedicalLetters = async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const where = patientId ? { patientId } : {};
    const letters = await prisma.medicalLetter.findMany({
      where,
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: { letters } });
  } catch (err) {
    console.error('[getMedicalLetters] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMedicalLetterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const letter = await prisma.medicalLetter.findUnique({
      where: { id },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } },
    });
    if (!letter) return res.status(404).json({ success: false, error: 'Courrier non trouve' });
    return res.json({ success: true, data: letter });
  } catch (err) {
    console.error('[getMedicalLetterById] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createMedicalLetter = async (req: Request, res: Response) => {
  try {
    const data = createLetterSchema.parse(req.body);
    const letter = await prisma.medicalLetter.create({
      data: { patientId: data.patientId, type: data.type, recipient: data.recipient, subject: data.subject, content: (data.content || {}) as any },
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
    const parsed = createLetterSchema.partial().parse(req.body);
    const { patientId: _pid, content: _ct, ...data } = parsed;
    const letter = await prisma.medicalLetter.update({
      where: { id },
      data,
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
    await prisma.medicalLetter.delete({ where: { id } });
    return res.json({ success: true, data: { message: 'Courrier supprime' } });
  } catch (err) {
    console.error('[deleteMedicalLetter] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
