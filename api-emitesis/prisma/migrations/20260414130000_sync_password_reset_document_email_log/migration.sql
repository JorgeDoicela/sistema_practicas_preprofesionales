-- Sincroniza la BD con el schema: columnas y tabla que existían en schema.prisma pero no en migraciones previas.

-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'INCUMPLIDO';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
