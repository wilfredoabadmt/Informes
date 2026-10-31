-- CreateEnum
CREATE TYPE "EstadoAsignacion" AS ENUM ('ACTIVA', 'SUSPENDIDA', 'FINALIZADA');

-- CreateTable
CREATE TABLE "asignaciones_academicas" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "gestion_id" UUID NOT NULL,
    "vinculacion_id" UUID NOT NULL,
    "paralelo_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "horas_semanales" INTEGER NOT NULL DEFAULT 4,
    "es_titular" BOOLEAN NOT NULL DEFAULT true,
    "es_tutor" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoAsignacion" NOT NULL DEFAULT 'ACTIVA',
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_academicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asignaciones_academicas_institucion_id_idx" ON "asignaciones_academicas"("institucion_id");

-- CreateIndex
CREATE INDEX "asignaciones_academicas_gestion_id_idx" ON "asignaciones_academicas"("gestion_id");

-- CreateIndex
CREATE INDEX "asignaciones_academicas_vinculacion_id_idx" ON "asignaciones_academicas"("vinculacion_id");

-- CreateIndex
CREATE INDEX "asignaciones_academicas_paralelo_id_idx" ON "asignaciones_academicas"("paralelo_id");

-- CreateIndex
CREATE INDEX "asignaciones_academicas_materia_id_idx" ON "asignaciones_academicas"("materia_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_academicas_gestion_id_paralelo_id_materia_id_v_key" ON "asignaciones_academicas"("gestion_id", "paralelo_id", "materia_id", "vinculacion_id");

-- AddForeignKey
ALTER TABLE "asignaciones_academicas" ADD CONSTRAINT "asignaciones_academicas_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_academicas" ADD CONSTRAINT "asignaciones_academicas_gestion_id_fkey" FOREIGN KEY ("gestion_id") REFERENCES "gestiones_escolares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_academicas" ADD CONSTRAINT "asignaciones_academicas_vinculacion_id_fkey" FOREIGN KEY ("vinculacion_id") REFERENCES "vinculaciones_institucionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_academicas" ADD CONSTRAINT "asignaciones_academicas_paralelo_id_fkey" FOREIGN KEY ("paralelo_id") REFERENCES "paralelos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_academicas" ADD CONSTRAINT "asignaciones_academicas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) - ASIGNACIONES ACADEMICAS
-- =============================================================

ALTER TABLE "asignaciones_academicas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asignaciones_academicas" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_asignaciones"
ON "asignaciones_academicas"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);
