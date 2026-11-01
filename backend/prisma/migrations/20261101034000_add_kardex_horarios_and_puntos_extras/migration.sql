-- AlterEnum
ALTER TYPE "DimensionEvaluacion" ADD VALUE IF NOT EXISTS 'PUNTOS_EXTRAS';

-- CreateTable
CREATE TABLE IF NOT EXISTS "registros_kardex" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "estudiante_id" UUID NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "falta_con_licencia" BOOLEAN NOT NULL DEFAULT false,
    "falta_sin_licencia" BOOLEAN NOT NULL DEFAULT false,
    "fuera_de_horario" BOOLEAN NOT NULL DEFAULT false,
    "abandono_clase" BOOLEAN NOT NULL DEFAULT false,
    "no_presento_deber" BOOLEAN NOT NULL DEFAULT false,
    "no_dio_evaluacion" BOOLEAN NOT NULL DEFAULT false,
    "no_expuso" BOOLEAN NOT NULL DEFAULT false,
    "no_trajo_materiales" BOOLEAN NOT NULL DEFAULT false,
    "dano_mobiliario" BOOLEAN NOT NULL DEFAULT false,
    "trajo_celular_sin_permiso" BOOLEAN NOT NULL DEFAULT false,
    "no_participa" BOOLEAN NOT NULL DEFAULT false,
    "no_presta_atencion" BOOLEAN NOT NULL DEFAULT false,
    "falto_respeto_docente" BOOLEAN NOT NULL DEFAULT false,
    "falto_respeto_companeros" BOOLEAN NOT NULL DEFAULT false,
    "lenguaje_inapropiado" BOOLEAN NOT NULL DEFAULT false,
    "observacion_detalle" VARCHAR(500) NOT NULL,
    "compromiso_estudiante" VARCHAR(500),
    "citacion_padres" BOOLEAN NOT NULL DEFAULT false,
    "fecha_citacion" DATE,
    "hora_citacion" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_kardex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "horarios_periodos" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "aula" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_periodos_pkey" PRIMARY KEY ("id")
);

-- Indexes for registros_kardex
CREATE INDEX IF NOT EXISTS "registros_kardex_institucion_id_idx" ON "registros_kardex"("institucion_id");
CREATE INDEX IF NOT EXISTS "registros_kardex_estudiante_id_idx" ON "registros_kardex"("estudiante_id");
CREATE INDEX IF NOT EXISTS "registros_kardex_fecha_idx" ON "registros_kardex"("fecha");

-- Indexes for horarios_periodos
CREATE INDEX IF NOT EXISTS "horarios_periodos_institucion_id_idx" ON "horarios_periodos"("institucion_id");
CREATE INDEX IF NOT EXISTS "horarios_periodos_asignacion_id_idx" ON "horarios_periodos"("asignacion_id");
CREATE UNIQUE INDEX IF NOT EXISTS "horarios_periodos_asignacion_id_dia_semana_periodo_key" ON "horarios_periodos"("asignacion_id", "dia_semana", "periodo");

-- Unique enrollment constraint (A student cannot be enrolled twice in the same school year)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inscripciones_gestion_id_estudiante_id_key'
    ) THEN
        ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_gestion_id_estudiante_id_key" UNIQUE ("gestion_id", "estudiante_id");
    END IF;
END $$;

-- Foreign Keys for registros_kardex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_kardex_institucion_id_fkey') THEN
        ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_kardex_estudiante_id_fkey') THEN
        ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_kardex_registrado_por_id_fkey') THEN
        ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign Keys for horarios_periodos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'horarios_periodos_institucion_id_fkey') THEN
        ALTER TABLE "horarios_periodos" ADD CONSTRAINT "horarios_periodos_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'horarios_periodos_asignacion_id_fkey') THEN
        ALTER TABLE "horarios_periodos" ADD CONSTRAINT "horarios_periodos_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_academicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Row Level Security for registros_kardex
ALTER TABLE "registros_kardex" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registros_kardex" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_policy_registros_kardex') THEN
        CREATE POLICY "tenant_isolation_policy_registros_kardex"
        ON "registros_kardex"
        FOR ALL
        USING (institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid)
        WITH CHECK (institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid);
    END IF;
END $$;

-- Row Level Security for horarios_periodos
ALTER TABLE "horarios_periodos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "horarios_periodos" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_policy_horarios_periodos') THEN
        CREATE POLICY "tenant_isolation_policy_horarios_periodos"
        ON "horarios_periodos"
        FOR ALL
        USING (institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid)
        WITH CHECK (institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid);
    END IF;
END $$;

