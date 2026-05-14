import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { auditMiddleware } from "./middleware/auditLog";
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './routes';
import { prisma } from './prisma';

dotenv.config();

const ALLOWED_ENV_OVERRIDES = new Set(['PORT', 'CORS_ORIGIN', 'FRONTEND_URL', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX']);
const systemConfigPath = path.join(process.cwd(), 'data', 'system-config.json');
try {
  if (fs.existsSync(systemConfigPath)) {
    const overrides = JSON.parse(fs.readFileSync(systemConfigPath, 'utf-8'));
    for (const [key, val] of Object.entries(overrides)) {
      if (typeof val === 'string' && ALLOWED_ENV_OVERRIDES.has(key)) process.env[key] = val;
    }
    console.log('⚙️  Configuration système chargée');
  }
} catch { /* ignore */ }

// Vérification des variables d'environnement critiques
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Variables d'environnement manquantes : ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// ── Sécurité ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(auditMiddleware);
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '') || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '') || 20,
  message: { success: false, error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/patient/login', authLimiter);
app.use('/api/auth/superadmin/login', authLimiter);
app.use('/api/auth/secretary/login', authLimiter);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Fichiers statiques (uploads) ─────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Rappel automatique patient (multiples délais) ────────────────
import { sendPatientEmail, getReminderTimings } from './services/notificationService';
const sentReminders = new Set<string>();
async function sendReminders() {
  try {
    const timings = getReminderTimings();
    const now = new Date();

    for (const hours of timings) {
      const windowStart = new Date(now.getTime() + hours * 60 * 60 * 1000);
      const windowEnd = new Date(windowStart.getTime() + 30 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          startTime: { gte: windowStart, lte: windowEnd },
        },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          doctor: { select: { firstName: true, lastName: true, clinicName: true, address: true } },
        },
      });

      for (const apt of appointments) {
        if (!apt.patient.user.email) continue;
        const key = `${apt.id}-${hours}h`;
        if (sentReminders.has(key)) continue;
        sentReminders.add(key);

        const frD = apt.startTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const frT = apt.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const label = hours >= 24 ? `${Math.floor(hours / 24)}j` : `${hours}h`;
        await sendPatientEmail(apt.patientId, apt.doctorId, 'reminder_patient', {
          patientFirstName: apt.patient.user.firstName,
          patientLastName: apt.patient.user.lastName,
          doctorFirstName: apt.doctor.firstName,
          doctorLastName: apt.doctor.lastName,
          appointmentDate: frD,
          appointmentTime: frT,
          clinicName: apt.doctor.clinicName || '',
          clinicAddress: apt.doctor.address || '',
        });
        console.log(`[REMINDER] Rappel ${label} envoyé à ${apt.patient.user.email} pour le RDV ${apt.id}`);
      }
    }
  } catch (err) {
    console.error('[REMINDER] Erreur:', err);
  }
}
// Limiter la taille du Set pour éviter les fuites mémoire (nettoie les entrées > 7 jours)
setInterval(() => {
  if (sentReminders.size > 10000) sentReminders.clear();
}, 3600000);
// Vérifier toutes les 15 minutes
const REMINDER_INTERVAL = 15 * 60 * 1000;
const reminderTimer = setInterval(sendReminders, REMINDER_INTERVAL);
// Premier run après 30s
setTimeout(sendReminders, 30 * 1000);

// ── Gestion des erreurs 404 ───────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint non trouvé' });
});

// ── Démarrage du serveur ─────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🏥 GyneCare API running on http://localhost:${PORT}`);
});

// ── Fermeture gracieuse ───────────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} reçu — fermeture en cours...`);
  clearInterval(reminderTimer);
  server.close(() => {
    prisma.$disconnect().then(() => {
      console.log('✅ Connexion base de données fermée.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
