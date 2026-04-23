-- AlterTable
ALTER TABLE "Company" ADD COLUMN "city" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "sector" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "verificationCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "cedula" TEXT,
ADD COLUMN "ciclo" TEXT,
ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "maxInterns" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN "businessTutorPhone" TEXT,
ADD COLUMN "businessTutorPosition" TEXT,
ADD COLUMN "activityDescription" TEXT;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "activityDescription" TEXT;


-- CreateIndex
CREATE UNIQUE INDEX "Document_verificationCode_key" ON "Document"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_cedula_key" ON "User"("cedula");
