import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getMyDossier = async (req: Request, res: Response) => {
  try {
    // Une seule requête : userId suffit pour cibler le bon patient
    const dossier = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        consultations: {
          where: { isConfidential: false },
          orderBy: { date: 'desc' }, take: 5,
          select: { id: true, date: true, type: true, diagnosis: true, nextVisit: true, treatment: true },
        },
        prescriptions: { where: { isValid: true }, orderBy: { date: 'desc' }, take: 5 },
        appointments: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' }, take: 3,
          include: { doctor: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!dossier) return res.status(404).json({ success: false, error: 'Dossier non trouvé' });
    return res.json({ success: true, data: dossier });
  } catch (err) {
    console.error('[getMyDossier] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMyConsultations = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouvé' });
    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id, isConfidential: false },
      orderBy: { date: 'desc' },
      select: { id: true, date: true, type: true, diagnosis: true, treatment: true, nextVisit: true, notes: true },
    });
    return res.json({ success: true, data: consultations });
  } catch (err) {
    console.error('[getMyConsultations] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMyPrescriptions = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient non trouvé' });
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { consultation: { select: { date: true, type: true } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: prescriptions });
  } catch (err) {
    console.error('[getMyPrescriptions] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMyAppointments = async (req: Request, res: Response) => {
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
    console.error('[getMyAppointments] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
