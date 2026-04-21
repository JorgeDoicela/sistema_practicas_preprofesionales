-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: add_modalidad_enum
-- Agrega el enum Modalidad y las columnas correspondientes en Career e Internship.
-- Internship.location pasa a ser opcional (ya no NOT NULL) para permitir prácticas
-- sin dirección física en modalidades remotas/en línea.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Crear el enum Modalidad
CREATE TYPE "Modalidad" AS ENUM ('PRESENCIAL', 'SEMIPRESENCIAL', 'EN_LINEA', 'HIBRIDA');

-- 2. Agregar columna modalidad a Career (default PRESENCIAL para filas existentes)
ALTER TABLE "Career" ADD COLUMN "modalidad" "Modalidad" NOT NULL DEFAULT 'PRESENCIAL';

-- 3. Agregar columna modalidad a Internship (default PRESENCIAL para filas existentes)
ALTER TABLE "Internship" ADD COLUMN "modalidad" "Modalidad" NOT NULL DEFAULT 'PRESENCIAL';

-- 4. Hacer location opcional en Internship
--    (las prácticas EN_LINEA / HIBRIDA pueden no tener dirección física fija)
ALTER TABLE "Internship" ALTER COLUMN "location" DROP NOT NULL;
