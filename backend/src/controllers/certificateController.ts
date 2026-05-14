import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const createCertificateSchema = z.object({
  patientId: z.string().min(1, 'patientId requis'),
  type: z.enum(['APTITUDE', 'MEDICAL_REST', 'PREGNANCY_WORK', 'MATERNITY_LEAVE', 'RETURN_TO_WORK', 'POST_OPERATIVE']),
  content: z.record(z.unknown()).optional(),
});

export const getCertificates = async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const doctorId = req.user!.userId;
    const patients = await prisma.patient.findMany({ where: { doctorId }, select: { id: true } });
    const patientIds = patients.map(p => p.id);
    const where: any = {};
    if (patientId) {
      if (!patientIds.includes(patientId)) return res.status(403).json({ success: false, error: 'Acces refuse' });
      where.patientId = patientId;
    } else {
      where.patientId = { in: patientIds };
    }
    const certificates = await prisma.certificate.findMany({
      where,
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: { certificates } });
  } catch (err) {
    console.error('[getCertificates] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getCertificateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } },
    });
    if (!certificate) return res.status(404).json({ success: false, error: 'Certificat non trouve' });
    const patient = await prisma.patient.findFirst({ where: { id: certificate.patientId, doctorId } });
    if (!patient) return res.status(403).json({ success: false, error: 'Acces refuse' });
    return res.json({ success: true, data: certificate });
  } catch (err) {
    console.error('[getCertificateById] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createCertificate = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const data = createCertificateSchema.parse(req.body);
    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, doctorId } });
    if (!patient) return res.status(403).json({ success: false, error: 'Patient non trouve ou acces refuse' });
    const certificate = await prisma.certificate.create({
      data: { patientId: data.patientId, type: data.type, content: (data.content || {}) as any },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return res.status(201).json({ success: true, data: certificate });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message });
    console.error('[createCertificate] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.userId;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, error: 'Certificat non trouve' });
    const patient = await prisma.patient.findFirst({ where: { id: cert.patientId, doctorId } });
    if (!patient) return res.status(403).json({ success: false, error: 'Acces refuse' });
    await prisma.certificate.delete({ where: { id } });
    return res.json({ success: true, data: { message: 'Certificat supprime' } });
  } catch (err) {
    console.error('[deleteCertificate] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
