-- AlterTable: ajout de doctorId (isolation multi-médecin) + isArchived (soft delete)
ALTER TABLE "patients" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "patients" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
