import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const updateProfileSchema = z.object({
  firstName:      z.string().min(1).optional(),
  lastName:       z.string().min(1).optional(),
  phone:          z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber:  z.string().optional(),
  rppsNumber:     z.string().optional(),
  clinicName:     z.string().optional(),
  address:        z.string().optional(),
  city:           z.string().optional(),
  postalCode:     z.string().optional(),
  country:        z.string().optional(),
  logo:           z.string().max(500).nullable().optional(),
  services:       z.string().max(1000).nullable().optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error('[getProfile] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    console.error('[updateProfile] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
      return;
    }
    const logoUrl = `/uploads/logos/${file.filename}`;
    await prisma.user.update({ where: { id: req.user!.userId }, data: { logo: logoUrl } });
    res.json({ success: true, data: { logo: logoUrl } });
  } catch (err) {
    console.error('[uploadLogo] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
