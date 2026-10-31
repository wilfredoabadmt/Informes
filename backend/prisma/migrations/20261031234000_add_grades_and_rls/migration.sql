-- CreateTable
CREATE TABLE "calificaciones" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "evaluacion_id" UUID NOT NULL,
    "estudiante_id" UUID NOT NULL,
    "nota" INTEGER NOT NULL,
    "observacion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calificaciones_institucion_id_idx" ON "calificaciones"("institucion_id");

-- CreateIndex
CREATE INDEX "calificaciones_evaluacion_id_idx" ON "calificaciones"("evaluacion_id");

-- CreateIndex
CREATE INDEX "calificaciones_estudiante_id_idx" ON "calificaciones"("estudiante_id");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_evaluacion_id_estudiante_id_key" ON "calificaciones"("evaluacion_id", "estudiante_id");

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) - FEATURE 009
-- =============================================================

ALTER TABLE "calificaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calificaciones" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_calificaciones"
ON "calificaciones"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);
