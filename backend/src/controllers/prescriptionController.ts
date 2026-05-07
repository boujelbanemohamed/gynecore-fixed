import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const medicationSchema = z.object({
  name: z.string().min(1, 'Nom du medicament requis'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
});

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  consultationId: z.string().optional(),
  medications: z.array(medicationSchema).min(1, 'Au moins un medicament requis'),
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const where = patientId ? { patientId } : {};
    const prescriptions = await prisma.prescription.findMany({
      where,
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } }, consultation: { select: { id: true, date: true, type: true } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: { prescriptions } });
  } catch (err) {
    console.error('[getPrescriptions] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  try {
    const data = createPrescriptionSchema.parse(req.body);
    const prescription = await prisma.prescription.create({
      data: { patientId: data.patientId, consultationId: data.consultationId, medications: data.medications, notes: data.notes, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: prescription });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message });
    console.error('[createPrescription] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { medications, notes } = req.body;
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ success: false, error: 'Au moins un medicament requis' });
    }
    const prescription = await prisma.prescription.update({
      where: { id },
      data: { medications, notes: notes || null },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.json({ success: true, data: prescription });
  } catch (err) {
    console.error('[updatePrescription] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouve' });
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { consultation: { select: { id: true, date: true, type: true, diagnosis: true } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: prescriptions });
  } catch (err) {
    console.error('[getPatientPrescriptions] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } }, consultation: { select: { id: true, date: true, type: true, diagnosis: true } } },
    });
    if (!prescription) return res.status(404).json({ success: false, error: 'Ordonnance non trouvee' });
    return res.json({ success: true, data: prescription });
  } catch (err) {
    console.error('[getPrescriptionById] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
