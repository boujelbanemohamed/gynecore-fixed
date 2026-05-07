import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const loginDoctor = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.role === Role.PATIENT) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'fallback-dev-secret-change-me',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as unknown as number }
    );
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, email: user.email,
          firstName: user.firstName, lastName: user.lastName, role: user.role,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[loginDoctor] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const loginPatient = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { patient: true } });
    if (!user || !user.isActive || user.role !== Role.PATIENT) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'fallback-dev-secret-change-me',
      { expiresIn: (process.env.JWT_PATIENT_EXPIRES_IN || '12h') as unknown as number }
    );
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, email: user.email,
          firstName: user.firstName, lastName: user.lastName, role: user.role,
          patientId: user.patient?.id,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[loginPatient] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { patient: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error('[getMe] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
