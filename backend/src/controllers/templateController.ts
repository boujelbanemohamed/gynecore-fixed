import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { sendTestEmail, getTemplates, getDefaultTemplate, FALLBACK_TEMPLATES, getReminderTimings } from '../services/notificationService';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'system-config.json');

function readConfig(): Record<string, any> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function writeConfig(config: Record<string, any>) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

const templateSchema = z.object({
  key: z.string().min(1, 'Clé requise'),
  subject: z.string().min(1, 'Sujet requis'),
  body: z.string().min(1, 'Corps requis'),
});

const TEMPLATE_KEYS = [
  'appointment_created_doctor',
  'appointment_created_patient',
  'appointment_status_changed',
  'appointment_modified_doctor',
  'unavailable_slot_created',
  'reminder_patient',
];

// ── GET /superadmin/templates ──────────────────────────────────────
export const getTemplatesList = async (_req: Request, res: Response) => {
  try {
    const config = readConfig();
    const userTemplates = config.emailTemplates || {};

    const templates = TEMPLATE_KEYS.map(key => {
      const userTmpl = userTemplates[key];
      const defaultTmpl = getDefaultTemplate(key);
      return {
        key,
        subject: userTmpl?.subject || defaultTmpl?.subject || '',
        body: userTmpl?.body || defaultTmpl?.body || '',
        isCustom: !!userTmpl,
      };
    });

    const reminderTimings = getReminderTimings();

    res.json({
      success: true,
      data: { templates, reminderTimings, templateKeys: TEMPLATE_KEYS },
    });
  } catch (err) {
    console.error('[templateController] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── PUT /superadmin/templates/:key ─────────────────────────────────
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (!TEMPLATE_KEYS.includes(key)) {
      return res.status(400).json({ success: false, error: 'Clé de template invalide' });
    }

    const data = templateSchema.parse({ ...req.body, key });
    const config = readConfig();

    if (!config.emailTemplates) config.emailTemplates = {};
    config.emailTemplates[key] = { subject: data.subject, body: data.body };

    writeConfig(config);
    res.json({ success: true, message: 'Template mis à jour' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error('[templateController] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── POST /superadmin/templates/:key/reset ──────────────────────────
export const resetTemplate = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (!TEMPLATE_KEYS.includes(key)) {
      return res.status(400).json({ success: false, error: 'Clé de template invalide' });
    }

    const config = readConfig();
    if (config.emailTemplates) {
      delete config.emailTemplates[key];
      if (Object.keys(config.emailTemplates).length === 0) {
        delete config.emailTemplates;
      }
    }
    writeConfig(config);

    const defaultTmpl = getDefaultTemplate(key);
    res.json({
      success: true,
      message: 'Template réinitialisé',
      data: { subject: defaultTmpl?.subject || '', body: defaultTmpl?.body || '' },
    });
  } catch (err) {
    console.error('[templateController] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── POST /superadmin/templates/test ────────────────────────────────
export const testTemplate = async (req: Request, res: Response) => {
  try {
    const { key, to, subject, body } = req.body;
    if (!key || !to) {
      return res.status(400).json({ success: false, error: 'key et to requis' });
    }

    const doctorId = req.user!.userId;
    const context = {
      doctorFirstName: 'Jean',
      doctorLastName: 'Martin',
      patientFirstName: 'Marie',
      patientLastName: 'Dupont',
      appointmentDate: '15 juin 2026',
      appointmentTime: '14h30',
      appointmentType: 'Suivi',
      appointmentStatus: 'CONFIRMÉ',
      clinicName: 'Cabinet Médical',
      clinicAddress: '12 Rue de la Santé, Paris',
      reason: 'Examen de routine',
    };

    // Use custom subject/body if provided (from test form), else use saved template
    if (subject && body) {
      // Temporarily save to config for the test
      const config = readConfig();
      if (!config.emailTemplates) config.emailTemplates = {};
      const orig = config.emailTemplates[key];
      config.emailTemplates[key] = { subject, body };
      writeConfig(config);
      await sendTestEmail(doctorId, to, key, context);
      // Restore
      if (orig) {
        config.emailTemplates[key] = orig;
      } else {
        delete config.emailTemplates[key];
      }
      writeConfig(config);
    } else {
      await sendTestEmail(doctorId, to, key, context);
    }

    res.json({ success: true, message: `Email de test envoyé à ${to}` });
  } catch (err) {
    console.error('[templateController] Erreur test:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi du test' });
  }
};

// ── GET /superadmin/reminder-settings ──────────────────────────────
export const getReminderSettings = async (_req: Request, res: Response) => {
  try {
    const timings = getReminderTimings();
    res.json({ success: true, data: { reminderTimings: timings } });
  } catch (err) {
    console.error('[templateController] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── PUT /superadmin/reminder-settings ──────────────────────────────
export const updateReminderSettings = async (req: Request, res: Response) => {
  try {
    const { reminderTimings } = req.body;
    if (!Array.isArray(reminderTimings) || reminderTimings.length === 0) {
      return res.status(400).json({ success: false, error: 'Au moins un délai de rappel est requis' });
    }
    for (const h of reminderTimings) {
      if (typeof h !== 'number' || h < 1 || h > 168) {
        return res.status(400).json({ success: false, error: 'Chaque délai doit être entre 1 et 168 heures' });
      }
    }

    const unique = [...new Set(reminderTimings)].sort((a, b) => b - a);
    const config = readConfig();
    config.reminderTimings = unique;
    delete config.reminderTimingHours;
    writeConfig(config);

    const labels = unique.map(h => `${h}h`).join(', ');
    res.json({ success: true, message: `Rappels programmés : ${labels} avant le rendez-vous` });
  } catch (err) {
    console.error('[templateController] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
