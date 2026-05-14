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
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions,
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
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_PATIENT_EXPIRES_IN || '12h' } as SignOptions,
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


export const loginSuperadmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.role !== Role.SUPERADMIN) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' } as SignOptions,
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
    console.error('[loginSuperadmin] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const loginSecretary = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.role !== Role.SECRETARY) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions,
    );
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, email: user.email,
          firstName: user.firstName, lastName: user.lastName, role: user.role,
          doctorId: user.doctorId,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[loginSecretary] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};


export const updateSuperadminProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifie' });
    const { firstName, lastName, email } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, message: 'Acces refuse' });
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ success: false, message: 'Email deja utilise' });
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { firstName, lastName, email } });
    const { password: _, ...profile } = updated;
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSecretaryProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifie' });
    const { firstName, lastName, email, phone } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SECRETARY') return res.status(403).json({ success: false, message: 'Acces refuse' });
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ success: false, message: 'Email deja utilise' });
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { firstName, lastName, email, phone } });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
