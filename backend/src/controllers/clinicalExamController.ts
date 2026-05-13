import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getClinicalExams = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const exams = await prisma.clinicalExam.findMany({
      where: { patient: { doctorId } },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: { exams } });
  } catch (err) {
    console.error('[getClinicalExams]', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getClinicalExamById = async (req: Request, res: Response) => {
  try {
    const exam = await prisma.clinicalExam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, error: 'Examen non trouve' });
    return res.json({ success: true, data: exam });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createClinicalExam = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { patientId, date, weight, height, heartRate, bloodPressure, temperature,
      generalState, conjonctives, oedemes, cardiacAuscultation, pulmonaryAuscultation,
      abdomen, uterusState, uterineHeight, presentation, bcf, adnexa,
      cervixAspect, vaginalDischarge, dilatation, effacement, consistency, presentationHeight,
      breastExam, clinicalConclusion, notes } = req.body;

    const patient = await prisma.patient.findFirst({ where: { id: patientId, doctorId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patiente non trouvee' });

    const exam = await prisma.clinicalExam.create({
      data: {
        patientId, date: date ? new Date(date) : new Date(),
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        bloodPressure, temperature: temperature ? parseFloat(temperature) : undefined,
        generalState, conjonctives, oedemes, cardiacAuscultation, pulmonaryAuscultation,
        abdomen, uterusState, uterineHeight: uterineHeight ? parseFloat(uterineHeight) : undefined,
        presentation, bcf, adnexa, cervixAspect, vaginalDischarge, dilatation, effacement,
        consistency, presentationHeight, breastExam, clinicalConclusion, notes,
      },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: exam });
  } catch (err) {
    console.error('[createClinicalExam]', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateClinicalExam = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const exam = await prisma.clinicalExam.findFirst({
      where: { id: req.params.id, patient: { doctorId } },
    });
    if (!exam) return res.status(404).json({ success: false, error: 'Examen non trouve' });

    const data: Record<string, unknown> = { ...req.body };
    if (data.date) data.date = new Date(data.date as string);
    if (data.weight) data.weight = parseFloat(data.weight as string);
    if (data.height) data.height = parseFloat(data.height as string);
    if (data.uterineHeight) data.uterineHeight = parseFloat(data.uterineHeight as string);
    if (data.temperature) data.temperature = parseFloat(data.temperature as string);

    const updated = await prisma.clinicalExam.update({
      where: { id: req.params.id }, data,
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[updateClinicalExam]', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteClinicalExam = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const exam = await prisma.clinicalExam.findFirst({
      where: { id: req.params.id, patient: { doctorId } },
    });
    if (!exam) return res.status(404).json({ success: false, error: 'Examen non trouve' });
    await prisma.clinicalExam.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Examen supprime' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
