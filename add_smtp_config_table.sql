-- Migration: Ajout de la table smtp_configs
-- A executer dans PostgreSQL directement ou via prisma migrate

CREATE TABLE IF NOT EXISTS smtp_configs (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "doctorId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "smtpHost"  TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  "smtpPort"  INTEGER NOT NULL DEFAULT 587,
  "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
  "smtpUser"  TEXT NOT NULL DEFAULT '',
  "smtpPass"  TEXT NOT NULL DEFAULT '',
  "smtpFromName" TEXT NOT NULL DEFAULT 'GyneCare',
  "smtpFromEmail" TEXT NOT NULL DEFAULT '',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("doctorId")
);

CREATE INDEX IF NOT EXISTS idx_smtp_configs_doctorId ON smtp_configs("doctorId");
