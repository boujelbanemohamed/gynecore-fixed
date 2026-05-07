import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.userId } });
    if (!user) { res.status(404).json({ success: false, error: 'Utilisateur non trouve' }); return; }
    res.json({ success: true, data: user });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { firstName, lastName, phone, specialization, licenseNumber, rppsNumber, clinicName, address, city, postalCode, country } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phone, specialization, licenseNumber, rppsNumber, clinicName, address, city, postalCode, country }
    });
    res.json({ success: true, data: user });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const file = (req as any).file;
    if (!file) { res.status(400).json({ success: false, error: 'Aucun fichier' }); return; }
    const logoUrl = `/uploads/logos/${file.filename}`;
    await prisma.user.update({ where: { id: userId }, data: { logo: logoUrl } });
    res.json({ success: true, data: { logo: logoUrl } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
};
