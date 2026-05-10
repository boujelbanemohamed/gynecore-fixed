import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// List all secretaries for the logged-in doctor
export const listSecretaries = async (req: Request, res: Response) => {
  try {
    const secretaries = await prisma.user.findMany({
      where: { role: 'SECRETARY', doctorId: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        cinNumber: true,
        address: true,
        city: true,
        postalCode: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: secretaries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new secretary
export const createSecretary = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, cinNumber, address, city, postalCode, password } = req.body;
    if (!email || !firstName || !lastName || !cinNumber || !password) {
      return res.status(400).json({ success: false, error: 'Email, nom, prenom, CIN et mot de passe sont requis' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Un compte avec cet email existe deja' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const secretary = await prisma.user.create({
      data: {
        email, firstName, lastName, phone, cinNumber, address, city, postalCode,
        password: hashedPassword,
        role: 'SECRETARY',
        doctorId: req.user!.userId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, cinNumber: true, address: true, city: true, postalCode: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: secretary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset secretary password
export const resetSecretaryPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Le mot de passe est requis' });
    }
    const secretary = await prisma.user.findFirst({ where: { id, role: 'SECRETARY', doctorId: req.user!.userId } });
    if (!secretary) {
      return res.status(404).json({ success: false, error: 'Secretaire non trouvee' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    res.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Toggle secretary active status
export const toggleSecretaryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const secretary = await prisma.user.findFirst({ where: { id, role: 'SECRETARY', doctorId: req.user!.userId } });
    if (!secretary) {
      return res.status(404).json({ success: false, error: 'Secretaire non trouvee' });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !secretary.isActive },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, cinNumber: true, address: true, city: true, postalCode: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Update secretary info
export const updateSecretary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, cinNumber, address, city, postalCode, email } = req.body;
    const secretary = await prisma.user.findFirst({ where: { id, role: 'SECRETARY', doctorId: req.user!.userId } });
    if (!secretary) {
      return res.status(404).json({ success: false, error: 'Secretaire non trouvee' });
    }
    if (email && email !== secretary.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, error: 'Un compte avec cet email existe deja' });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, phone, cinNumber, address, city, postalCode, email },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, cinNumber: true, address: true, city: true, postalCode: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};