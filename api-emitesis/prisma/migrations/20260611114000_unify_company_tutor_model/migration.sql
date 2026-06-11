-- Unifica actor empresarial en la cuenta EMPRESA y elimina campos denormalizados del tutor empresarial.
ALTER TABLE "Internship"
DROP COLUMN "businessTutorName",
DROP COLUMN "businessTutorEmail",
DROP COLUMN "businessTutorPhone",
DROP COLUMN "businessTutorPosition";

-- Backfill para evaluaciones empresariales históricas:
-- vincular al primer usuario EMPRESA de la compañía asociada a la práctica.
UPDATE "Evaluation" ev
SET "evaluatorId" = sub."id"
FROM (
  SELECT
    i."id" AS "internshipId",
    (
      SELECT u."id"
      FROM "User" u
      WHERE u."companyId" = i."companyId"
        AND u."role" = 'EMPRESA'::"Role"
      ORDER BY u."createdAt" ASC
      LIMIT 1
    ) AS "id"
  FROM "Internship" i
) sub
WHERE ev."internshipId" = sub."internshipId"
  AND ev."type" = 'EMPRESARIAL'::"EvaluationType"
  AND ev."evaluatorId" IS NULL
  AND sub."id" IS NOT NULL;

ALTER TABLE "Evaluation"
ADD CONSTRAINT "Evaluation_evaluatorId_fkey"
FOREIGN KEY ("evaluatorId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");
