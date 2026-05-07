import { Request, Response } from 'express';
import { prisma } from '../prisma';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    const file = (req as any).file;
    if (!file || !patientId) { res.status(400).json({ success: false, error: 'Fichier et patientId requis' }); return; }
    const doc = await prisma.document.create({
      data: {
        patientId, name: file.originalname, type: path.extname(file.originalname).slice(1).toUpperCase(),
        url: `/uploads/documents/${file.filename}`, size: file.size, mimeType: file.mimetype
      }
    });
    res.json({ success: true, data: doc });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};

export const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await prisma.document.findMany({ where: { patientId: req.params.patientId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: docs });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    await prisma.document.delete({ where: { id: req.params.documentId } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};
