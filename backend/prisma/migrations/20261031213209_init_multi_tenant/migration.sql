-- CreateEnum
CREATE TYPE "RolGlobal" AS ENUM ('SUPERADMIN', 'CENTRAL_ADMIN', 'INSTITUTIONAL_USER');

-- CreateEnum
CREATE TYPE "RolInstitucional" AS ENUM ('ADMIN_INSTITUCIONAL', 'DIRECTOR', 'SECRETARIO', 'MAESTRO', 'COMISION_PEDAGOGICA');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "EstadoVinculacion" AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA', 'TRASLADADO');

-- CreateEnum
CREATE TYPE "TipoInstitucion" AS ENUM ('FISCAL', 'CONVENIO', 'PRIVADA');

-- CreateEnum
CREATE TYPE "NivelEducativo" AS ENUM ('INICIAL', 'PRIMARIA', 'SECUNDARIA', 'INTEGRADO');

-- CreateEnum
CREATE TYPE "TipoAuditoria" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'CONTEXT_SWITCH', 'SECURITY_VIOLATION', 'USER_CREATE', 'USER_UPDATE', 'TEACHER_LINK', 'TEACHER_UNLINK');

-- CreateTable
CREATE TABLE "personas" (
    "id" UUID NOT NULL,
    "ci" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(10),
    "nombres" VARCHAR(100) NOT NULL,
    "primerApellido" VARCHAR(100) NOT NULL,
    "segundoApellido" VARCHAR(100),
    "fechaNacimiento" DATE,
    "genero" VARCHAR(10),
    "direccion" VARCHAR(255),
    "telefono" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "persona_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol_global" "RolGlobal" NOT NULL DEFAULT 'INSTITUTIONAL_USER',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maestros" (
    "id" UUID NOT NULL,
    "persona_id" UUID NOT NULL,
    "rda" VARCHAR(50) NOT NULL,
    "titulo_profesional" VARCHAR(255),
    "especialidad" VARCHAR(255),
    "anio_egreso" INTEGER,
    "normalista" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maestros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_educativas" (
    "id" UUID NOT NULL,
    "sie" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "departamento" VARCHAR(50) NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "municipio" VARCHAR(100) NOT NULL,
    "distrito" VARCHAR(100),
    "direccion" VARCHAR(255),
    "telefono" VARCHAR(20),
    "tipo" "TipoInstitucion" NOT NULL DEFAULT 'FISCAL',
    "nivel" "NivelEducativo" NOT NULL DEFAULT 'INTEGRADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_educativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculaciones_institucionales" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "maestro_id" UUID,
    "usuario_id" UUID NOT NULL,
    "rol_institucional" "RolInstitucional" NOT NULL,
    "cargo_oficial" VARCHAR(150),
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATE,
    "estado" "EstadoVinculacion" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculaciones_institucionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaced_by_token" VARCHAR(255),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "institucion_id" UUID,
    "tipo" "TipoAuditoria" NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "detalle" JSONB,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_ci_key" ON "personas"("ci");

-- CreateIndex
CREATE INDEX "personas_ci_idx" ON "personas"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_persona_id_key" ON "usuarios"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "maestros_persona_id_key" ON "maestros"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "maestros_rda_key" ON "maestros"("rda");

-- CreateIndex
CREATE INDEX "maestros_rda_idx" ON "maestros"("rda");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_educativas_sie_key" ON "unidades_educativas"("sie");

-- CreateIndex
CREATE INDEX "unidades_educativas_sie_idx" ON "unidades_educativas"("sie");

-- CreateIndex
CREATE INDEX "unidades_educativas_departamento_idx" ON "unidades_educativas"("departamento");

-- CreateIndex
CREATE INDEX "vinculaciones_institucionales_institucion_id_idx" ON "vinculaciones_institucionales"("institucion_id");

-- CreateIndex
CREATE INDEX "vinculaciones_institucionales_usuario_id_idx" ON "vinculaciones_institucionales"("usuario_id");

-- CreateIndex
CREATE INDEX "vinculaciones_institucionales_maestro_id_idx" ON "vinculaciones_institucionales"("maestro_id");

-- CreateIndex
CREATE UNIQUE INDEX "vinculaciones_institucionales_institucion_id_usuario_id_rol_key" ON "vinculaciones_institucionales"("institucion_id", "usuario_id", "rol_institucional");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "registros_auditoria_usuario_id_idx" ON "registros_auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "registros_auditoria_institucion_id_idx" ON "registros_auditoria"("institucion_id");

-- CreateIndex
CREATE INDEX "registros_auditoria_tipo_idx" ON "registros_auditoria"("tipo");

-- CreateIndex
CREATE INDEX "registros_auditoria_timestamp_idx" ON "registros_auditoria"("timestamp");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maestros" ADD CONSTRAINT "maestros_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculaciones_institucionales" ADD CONSTRAINT "vinculaciones_institucionales_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculaciones_institucionales" ADD CONSTRAINT "vinculaciones_institucionales_maestro_id_fkey" FOREIGN KEY ("maestro_id") REFERENCES "maestros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculaciones_institucionales" ADD CONSTRAINT "vinculaciones_institucionales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
