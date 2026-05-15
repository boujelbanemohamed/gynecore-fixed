-- Add new fields to Consultation model
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "heartRate" INTEGER;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "generalState" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "examDetails" JSONB;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "ddr" TIMESTAMP(3);
