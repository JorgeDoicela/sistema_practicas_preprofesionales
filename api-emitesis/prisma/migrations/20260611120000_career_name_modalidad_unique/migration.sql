-- Alinear índice único de Career con el schema: (name, modalidad) en lugar de solo name.
DROP INDEX IF EXISTS "Career_name_key";

CREATE UNIQUE INDEX "Career_name_modalidad_key" ON "Career"("name", "modalidad");
