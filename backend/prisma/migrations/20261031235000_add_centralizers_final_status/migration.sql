-- CreateEnum
CREATE TYPE "SituacionFinalEstudiante" AS ENUM ('PROMOVIDO', 'RETENIDO');

-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN "promedio_anual" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN "situacion_final" "SituacionFinalEstudiante";

-- =============================================================
-- NOTA DE ROW LEVEL SECURITY (RLS) - FEATURE 010
-- Las columnas nuevas "promedio_anual" y "situacion_final" de la
-- tabla "inscripciones" quedan amparadas por la política existente
-- "tenant_isolation_policy_inscripciones" (FOR ALL, USING + WITH
-- CHECK sobre app.current_institution_id). No se requiere DDL RLS
-- adicional para este cambio de esquema.
-- =============================================================
