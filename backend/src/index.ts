import express from 'express';
import cors from 'cors';
import { auditMiddleware } from "./middleware/auditLog";
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './routes';
import { prisma } from './prisma';

dotenv.config();

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/patient/login', authLimiter);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Fichiers statiques (uploads) ─────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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
