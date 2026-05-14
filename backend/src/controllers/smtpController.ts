import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { encrypt, decrypt } from '../utils/encryption';
import { prisma } from '../prisma';

// ── Schema de validation ──────────────────────────────────────────
const smtpSchema = z.object({
  smtpHost: z.string().min(1, 'Host requis'),
  smtpPort: z.number().int().min(1).max(65535, 'Port invalide'),
  smtpSecure: z.boolean().optional(),
  smtpUser: z.string().email('Email invalide'),
  smtpPass: z.string().min(1, 'Mot de passe requis'),
  smtpFromName: z.string().min(1, 'Nom expediteur requis'),
  smtpFromEmail: z.string().email('Email expediteur invalide'),
  enabled: z.boolean().optional(),
});

// ── Recuperer la config SMTP du medecin ───────────────────────────
export const getSmtpConfig = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const config = await prisma.smtpConfig.findUnique({ where: { doctorId } });

    if (!config) {
      // Retourner la config par defaut (valeurs depuis .env si disponibles)
      return res.json({
        success: true,
        data: {
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
          smtpSecure: (process.env.SMTP_SECURE || 'false') === 'true',
          smtpUser: process.env.SMTP_USER || '',
          smtpPass: '', // Jamais renvoyer le mot de passe stocke
          smtpFromName: process.env.SMTP_FROM_NAME || 'GyneCare',
          smtpFromEmail: process.env.SMTP_FROM_EMAIL || '',
          enabled: false,
        },
      });
    }

    // Masquer le mot de passe dans la reponse
    const { smtpPass, ...safeConfig } = config;
    return res.json({
      success: true,
      data: { ...safeConfig, smtpPass: '' },
    });
  } catch (err) {
    console.error('[getSmtpConfig] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── Sauvegarder la config SMTP ────────────────────────────────────
export const saveSmtpConfig = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const data = smtpSchema.parse({
      ...req.body,
      smtpSecure: req.body.smtpSecure ?? false,
      enabled: req.body.enabled ?? true,
    });

    // Upsert : creer ou mettre a jour
    const config = await prisma.smtpConfig.upsert({
      where: { doctorId },
      update: {
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPass: encrypt(data.smtpPass),
        smtpFromName: data.smtpFromName,
        smtpFromEmail: data.smtpFromEmail,
        enabled: data.enabled,
      },
      create: {
        doctorId,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPass: encrypt(data.smtpPass),
        smtpFromName: data.smtpFromName,
        smtpFromEmail: data.smtpFromEmail,
        enabled: data.enabled,
      },
    });

    const { smtpPass, ...safeConfig } = config;
    return res.json({ success: true, data: { ...safeConfig, smtpPass: '' } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[saveSmtpConfig] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── Tester la connexion SMTP ──────────────────────────────────────
export const testSmtpConnection = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;

    // Utiliser les donnees envoyees ou la config stockee
    let config: any;
    if (req.body.smtpHost) {
      config = smtpSchema.partial().parse(req.body);
    } else {
      config = await prisma.smtpConfig.findUnique({ where: { doctorId } });
      if (!config) {
        return res.status(400).json({ success: false, error: 'Aucune configuration SMTP trouvee. Sauvegardez d\'abord vos parametres.' });
      }
    }

    const transport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });

    await transport.verify();

    return res.json({ success: true, message: 'Connexion SMTP reussie ! Les emails peuvent etre envoyes.' });
  } catch (err: any) {
    console.error('[testSmtpConnection] Erreur:', err);
    const msg = err.message || 'Erreur de connexion SMTP';
    return res.status(400).json({ success: false, error: msg });
  }
};

// ── Supprimer la config SMTP (revenir aux valeurs .env) ────────────
export const deleteSmtpConfig = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    await prisma.smtpConfig.delete({ where: { doctorId } }).catch(() => {});
    return res.json({ success: true, message: 'Configuration SMTP supprimee. Utilisation des valeurs par defaut.' });
  } catch (err) {
    console.error('[deleteSmtpConfig] Erreur:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
