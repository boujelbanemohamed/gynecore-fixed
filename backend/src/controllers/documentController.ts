import { Request, Response } from 'express';
import { prisma } from '../prisma';
import path from 'path';
import fs from 'fs';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    const file = (req as any).file;
    const doctorId = req.user!.userId;

    if (!file || !patientId) {
      res.status(400).json({ success: false, error: 'Fichier et patientId requis' });
      return;
    }

    // Vérifie que le patient appartient à ce médecin
    const patient = await prisma.patient.findFirst({ where: { id: patientId, doctorId } });
    if (!patient) {
      // Supprime le fichier uploadé si le patient ne correspond pas
      fs.unlink(file.path, () => {});
      res.status(404).json({ success: false, error: 'Patiente non trouvée' });
      return;
    }

    const doc = await prisma.document.create({
      data: {
        patientId,
        name: file.originalname,
        type: path.extname(file.originalname).slice(1).toUpperCase(),
        url: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[uploadDocument] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { patientId } = req.params;

    // Vérifie que le patient appartient à ce médecin
    const patient = await prisma.patient.findFirst({ where: { id: patientId, doctorId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patiente non trouvée' });
      return;
    }

    const docs = await prisma.document.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[getPatientDocuments] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { documentId } = req.params;

    // Vérifie que le document appartient à un patient de ce médecin
    const doc = await prisma.document.findFirst({
      where: { id: documentId, patient: { doctorId } },
    });
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document non trouvé' });
      return;
    }

    await prisma.document.delete({ where: { id: documentId } });

    // Suppression du fichier physique
    const filePath = path.join(process.cwd(), doc.url);
    fs.unlink(filePath, () => {}); // silencieux si déjà supprimé

    res.json({ success: true });
  } catch (err) {
    console.error('[deleteDocument] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
