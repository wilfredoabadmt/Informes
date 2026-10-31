-- CreateEnum
CREATE TYPE "ParentescoTutor" AS ENUM ('PADRE', 'MADRE', 'TUTOR_LEGAL', 'ABUELO', 'HERMANO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('EFECTIVO', 'RETIRADO_TRASLADO', 'RETIRADO_ABANDONO', 'NO_INCORPORADO');

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" UUID NOT NULL,
    "persona_id" UUID NOT NULL,
    "codigo_rude" VARCHAR(50) NOT NULL,
    "nombre_tutor" VARCHAR(150),
    "ci_tutor" VARCHAR(20),
    "parentesco_tutor" "ParentescoTutor" DEFAULT 'PADRE',
    "telefono_tutor" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "estudiante_id" UUID NOT NULL,
    "gestion_id" UUID NOT NULL,
    "paralelo_id" UUID NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'EFECTIVO',
    "es_repitente" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" VARCHAR(255),
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_persona_id_key" ON "estudiantes"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_codigo_rude_key" ON "estudiantes"("codigo_rude");

-- CreateIndex
CREATE INDEX "estudiantes_codigo_rude_idx" ON "estudiantes"("codigo_rude");

-- CreateIndex
CREATE INDEX "inscripciones_institucion_id_idx" ON "inscripciones"("institucion_id");

-- CreateIndex
CREATE INDEX "inscripciones_estudiante_id_idx" ON "inscripciones"("estudiante_id");

-- CreateIndex
CREATE INDEX "inscripciones_gestion_id_idx" ON "inscripciones"("gestion_id");

-- CreateIndex
CREATE INDEX "inscripciones_paralelo_id_idx" ON "inscripciones"("paralelo_id");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_gestion_id_fkey" FOREIGN KEY ("gestion_id") REFERENCES "gestiones_escolares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_paralelo_id_fkey" FOREIGN KEY ("paralelo_id") REFERENCES "paralelos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) - INSCRIPCIONES
-- =============================================================

ALTER TABLE "inscripciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inscripciones" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy_inscripciones"
ON "inscripciones"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
);
