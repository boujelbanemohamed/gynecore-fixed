import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: 'Accès refusé' });
    next();
  };
};

export const authorizeDoctor = authorize(Role.DOCTOR, Role.ASSISTANT);
export const authorizePatient = authorize(Role.PATIENT);
export const authorizeSecretary = authorize(Role.SECRETARY);
