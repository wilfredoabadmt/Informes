-- CreateEnum
CREATE TYPE "TipoPeriodo" AS ENUM ('PRIMER_TRIMESTRE', 'SEGUNDO_TRIMESTRE', 'TERCER_TRIMESTRE');

-- CreateEnum
CREATE TYPE "EstadoPeriodo" AS ENUM ('PROGRAMADO', 'ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "DimensionEvaluacion" AS ENUM ('SER', 'SABER', 'HACER', 'DECIDIR', 'AUTOEVALUACION');

-- CreateTable
CREATE TABLE "periodos_evaluacion" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "gestion_id" UUID NOT NULL,
    "periodo" "TipoPeriodo" NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "fecha_limite_notas" DATE NOT NULL,
    "estado" "EstadoPeriodo" NOT NULL DEFAULT 'PROGRAMADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "periodo_id" UUID NOT NULL,
    "dimension" "DimensionEvaluacion" NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(255),
    "puntaje_maximo" INTEGER NOT NULL,
    "fecha_evaluacion" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodos_evaluacion_institucion_id_idx" ON "periodos_evaluacion"("institucion_id");

-- CreateIndex
CREATE INDEX "periodos_evaluacion_gestion_id_idx" ON "periodos_evaluacion"("gestion_id");

-- CreateIndex
CREATE INDEX "periodos_evaluacion_estado_idx" ON "periodos_evaluacion"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_evaluacion_gestion_id_periodo_key" ON "periodos_evaluacion"("gestion_id", "periodo");

-- CreateIndex
CREATE INDEX "evaluaciones_institucion_id_idx" ON "evaluaciones"("institucion_id");

-- CreateIndex
CREATE INDEX "evaluaciones_asignacion_id_idx" ON "evaluaciones"("asignacion_id");

-- CreateIndex
CREATE INDEX "evaluaciones_periodo_id_idx" ON "evaluaciones"("periodo_id");

-- CreateIndex
CREATE INDEX "evaluaciones_dimension_idx" ON "evaluaciones"("dimension");

-- CreateIndex
CREATE INDEX "evaluaciones_fecha_evaluacion_idx" ON "evaluaciones"("fecha_evaluacion");

-- AddForeignKey
ALTER TABLE "periodos_evaluacion" ADD CONSTRAINT "periodos_evaluacion_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_evaluacion" ADD CONSTRAINT "periodos_evaluacion_gestion_id_fkey" FOREIGN KEY ("gestion_id") REFERENCES "gestiones_escolares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_academicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos_evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) - FEATURE 008
-- =============================================================

ALTER TABLE "periodos_evaluacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "periodos_evaluacion" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_periodos_evaluacion"
ON "periodos_evaluacion"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);

ALTER TABLE "evaluaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluaciones" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_evaluaciones"
ON "evaluaciones"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);
