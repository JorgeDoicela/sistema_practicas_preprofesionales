-- AlterTable: Añadir campo testEnabled para activación opcional del test de aptitud por empresa (RF-07)
ALTER TABLE "Internship" ADD COLUMN "testEnabled" BOOLEAN NOT NULL DEFAULT false;
