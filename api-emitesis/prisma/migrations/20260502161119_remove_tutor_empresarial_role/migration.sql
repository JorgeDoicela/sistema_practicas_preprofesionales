/*
  Warnings:

  - The values [TUTOR_EMPRESARIAL] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
UPDATE "User" SET "role" = 'EMPRESA' WHERE "role" = 'TUTOR_EMPRESARIAL';
DELETE FROM "ChatPermission" WHERE "fromRole" = 'TUTOR_EMPRESARIAL' OR "toRole" = 'TUTOR_EMPRESARIAL';
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'COORDINADOR', 'TUTOR', 'ESTUDIANTE', 'EMPRESA');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "ChatPermission" ALTER COLUMN "fromRole" TYPE "Role_new" USING ("fromRole"::text::"Role_new");
ALTER TABLE "ChatPermission" ALTER COLUMN "toRole" TYPE "Role_new" USING ("toRole"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ENFERMEDAD',
    "filePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_internshipId_idx" ON "Absence"("internshipId");

-- CreateIndex
CREATE INDEX "Absence_date_idx" ON "Absence"("date");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
