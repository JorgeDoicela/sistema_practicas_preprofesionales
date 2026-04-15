-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isCertificateSlot" BOOLEAN NOT NULL DEFAULT false,
    "blankFileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentTemplate_isActive_sortOrder_idx" ON "DocumentTemplate"("isActive", "sortOrder");

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "templateId" TEXT,
ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isCertificateSlot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blankFileKey" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Document_internshipId_sortOrder_idx" ON "Document"("internshipId", "sortOrder");
CREATE INDEX "Document_templateId_idx" ON "Document"("templateId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Plantillas iniciales (equivalente a la lista fija anterior)
INSERT INTO "DocumentTemplate" ("id", "name", "sortOrder", "isActive", "isRequired", "isCertificateSlot", "blankFileKey", "createdAt", "updatedAt") VALUES
('a0000001-0000-4000-8000-000000000001', 'Solicitud de prácticas', 10, true, true, false, 'solicitud_practicas.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000002', 'Plan de rotación', 20, true, true, false, 'plan_rotacion.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000003', 'Informe de actividades', 30, true, true, false, 'informe_actividades.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000004', 'Registro de asistencia', 40, true, true, false, 'registro_asistencia.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000005', 'Evaluación del tutor académico', 50, true, true, false, 'evaluacion_tutor.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000006', 'Evaluación del representante de la empresa', 60, true, true, false, 'evaluacion_representante.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000007', 'Informe final de prácticas', 70, true, true, false, 'informe_final.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000001-0000-4000-8000-000000000008', 'Certificado de culminación', 80, true, false, true, 'certificado_culminacion.docx', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vincular documentos ya existentes por nombre
UPDATE "Document" AS d
SET
  "templateId" = t."id",
  "isRequired" = t."isRequired",
  "isCertificateSlot" = t."isCertificateSlot",
  "blankFileKey" = t."blankFileKey",
  "sortOrder" = t."sortOrder"
FROM "DocumentTemplate" AS t
WHERE d."name" = t."name";
