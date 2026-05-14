import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';

const updateProfileSchema = z.object({
  email:          z.string().email().optional(),
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
    if (data.email) {
      const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id: req.user.userId } } });
      if (existing) return res.status(409).json({ error: 'Email deja utilise.' });
    }
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

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouve.' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashed } });
    res.json({ message: 'Mot de passe mis a jour.' });
  } catch (err) {
    console.error('[changePassword] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
