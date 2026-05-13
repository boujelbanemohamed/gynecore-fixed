import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const createMedicalLetterSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  type: z.string().default('SPECIALIST_REFERRAL'),
  recipient: z.string().min(1, 'Destinataire requis'),
  subject: z.string().min(1, 'Objet requis'),
  content: z.union([z.string(), z.record(z.unknown())]).optional(),
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
      orderBy: { createdAt: 'desc' },
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
    let contentData: any = data.content || {};
    if (typeof contentData === 'string') {
      try { contentData = JSON.parse(contentData); } catch { contentData = { body: contentData }; }
    }
    const letter = await prisma.medicalLetter.create({
      data: { patientId: data.patientId, type: data.type, recipient: data.recipient, subject: data.subject, content: contentData },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: letter });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0];
      const field = e.path.join('.') || 'champ inconnu';
      return res.status(400).json({ success: false, error: `${e.message} (champ: ${field})` });
    }
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
    let contentData: any = data.content;
    if (contentData !== undefined && typeof contentData === 'string') {
      try { contentData = JSON.parse(contentData); } catch { contentData = { body: contentData }; }
    }
    const letter = await prisma.medicalLetter.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.recipient !== undefined && { recipient: data.recipient }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(contentData !== undefined && { content: contentData }),
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.json({ success: true, data: letter });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0];
      const field = e.path.join('.') || 'champ inconnu';
      return res.status(400).json({ success: false, error: `${e.message} (champ: ${field})` });
    }
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
