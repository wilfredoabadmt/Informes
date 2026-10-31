-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'FALTA', 'LICENCIA', 'ATRASO');

-- CreateTable
CREATE TABLE "registros_asistencia" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "paralelo_id" UUID NOT NULL,
    "asignacion_id" UUID,
    "registrado_por_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "observaciones" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_asistencia" (
    "id" UUID NOT NULL,
    "registro_asistencia_id" UUID NOT NULL,
    "estudiante_id" UUID NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL DEFAULT 'PRESENTE',
    "justificado" BOOLEAN NOT NULL DEFAULT false,
    "observacion" VARCHAR(255),

    CONSTRAINT "detalles_asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_asistencia_institucion_id_idx" ON "registros_asistencia"("institucion_id");

-- CreateIndex
CREATE INDEX "registros_asistencia_paralelo_id_idx" ON "registros_asistencia"("paralelo_id");

-- CreateIndex
CREATE INDEX "registros_asistencia_fecha_idx" ON "registros_asistencia"("fecha");

-- CreateIndex
CREATE INDEX "registros_asistencia_asignacion_id_idx" ON "registros_asistencia"("asignacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "registros_asistencia_paralelo_id_fecha_asignacion_id_key" ON "registros_asistencia"("paralelo_id", "fecha", "asignacion_id");

-- CreateIndex
CREATE INDEX "detalles_asistencia_registro_asistencia_id_idx" ON "detalles_asistencia"("registro_asistencia_id");

-- CreateIndex
CREATE INDEX "detalles_asistencia_estudiante_id_idx" ON "detalles_asistencia"("estudiante_id");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_asistencia_registro_asistencia_id_estudiante_id_key" ON "detalles_asistencia"("registro_asistencia_id", "estudiante_id");

-- AddForeignKey
ALTER TABLE "registros_asistencia" ADD CONSTRAINT "registros_asistencia_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_asistencia" ADD CONSTRAINT "registros_asistencia_paralelo_id_fkey" FOREIGN KEY ("paralelo_id") REFERENCES "paralelos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_asistencia" ADD CONSTRAINT "registros_asistencia_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_academicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_asistencia" ADD CONSTRAINT "registros_asistencia_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asistencia" ADD CONSTRAINT "detalles_asistencia_registro_asistencia_id_fkey" FOREIGN KEY ("registro_asistencia_id") REFERENCES "registros_asistencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asistencia" ADD CONSTRAINT "detalles_asistencia_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) - REGISTROS_ASISTENCIA
-- =============================================================

ALTER TABLE "registros_asistencia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registros_asistencia" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_registros_asistencia"
ON "registros_asistencia"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);
