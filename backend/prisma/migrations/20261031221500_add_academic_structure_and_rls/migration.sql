-- CreateEnum
CREATE TYPE "EstadoGestion" AS ENUM ('EN_PLANIFICACION', 'ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE', 'NOCHE');

-- CreateEnum
CREATE TYPE "CampoSaberes" AS ENUM ('COSMOS_Y_PENSAMIENTO', 'COMUNIDAD_Y_SOCIEDAD', 'VIDA_TIERRA_TERRITORIO', 'CIENCIA_TECNOLOGIA_PRODUCCION');

-- CreateTable
CREATE TABLE "gestiones_escolares" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "estado" "EstadoGestion" NOT NULL DEFAULT 'EN_PLANIFICACION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestiones_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "nivel" "NivelEducativo" NOT NULL,
    "grado" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "campo" "CampoSaberes" NOT NULL,
    "nivel" "NivelEducativo" NOT NULL,
    "es_troncal" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paralelos" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "gestion_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "letra" VARCHAR(5) NOT NULL,
    "turno" "Turno" NOT NULL DEFAULT 'MANANA',
    "cupo_maximo" INTEGER NOT NULL DEFAULT 35,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paralelos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gestiones_escolares_institucion_id_idx" ON "gestiones_escolares"("institucion_id");
CREATE UNIQUE INDEX "gestiones_escolares_institucion_id_anio_key" ON "gestiones_escolares"("institucion_id", "anio");
CREATE UNIQUE INDEX "cursos_nivel_grado_key" ON "cursos"("nivel", "grado");
CREATE UNIQUE INDEX "materias_codigo_key" ON "materias"("codigo");
CREATE INDEX "materias_nivel_idx" ON "materias"("nivel");
CREATE INDEX "materias_campo_idx" ON "materias"("campo");
CREATE INDEX "paralelos_institucion_id_idx" ON "paralelos"("institucion_id");
CREATE INDEX "paralelos_gestion_id_idx" ON "paralelos"("gestion_id");
CREATE INDEX "paralelos_curso_id_idx" ON "paralelos"("curso_id");
CREATE UNIQUE INDEX "paralelos_gestion_id_curso_id_letra_turno_key" ON "paralelos"("gestion_id", "curso_id", "letra", "turno");

-- AddForeignKey
ALTER TABLE "gestiones_escolares" ADD CONSTRAINT "gestiones_escolares_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paralelos" ADD CONSTRAINT "paralelos_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paralelos" ADD CONSTRAINT "paralelos_gestion_id_fkey" FOREIGN KEY ("gestion_id") REFERENCES "gestiones_escolares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paralelos" ADD CONSTRAINT "paralelos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable and force Row Level Security on gestiones_escolares
ALTER TABLE "gestiones_escolares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gestiones_escolares" FORCE ROW LEVEL SECURITY;

CREATE POLICY gestiones_isolation_policy ON "gestiones_escolares"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
);

-- Enable and force Row Level Security on paralelos
ALTER TABLE "paralelos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "paralelos" FORCE ROW LEVEL SECURITY;

CREATE POLICY paralelos_isolation_policy ON "paralelos"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
);

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maestros_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maestros_app;
