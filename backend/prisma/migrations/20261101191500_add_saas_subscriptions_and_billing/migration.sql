-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EstadoSuscripcion" AS ENUM ('TRIAL', 'ACTIVA', 'GRACIA', 'VENCIDA', 'CANCELADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PeriodoFacturacion" AS ENUM ('MENSUAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MetodoPagoSaaS" AS ENUM ('QR_SIMPLE', 'TRANSFERENCIA_BANCARIA', 'TARJETA_CREDITO_DEBITO', 'MANUAL_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EstadoPagoSaaS" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: planes_suscripcion
CREATE TABLE IF NOT EXISTS "planes_suscripcion" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "precio_mensual" DECIMAL(10,2) NOT NULL,
    "precio_anual" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'BOB',
    "max_estudiantes" INTEGER NOT NULL DEFAULT 100,
    "max_docentes" INTEGER NOT NULL DEFAULT 10,
    "permite_reportes_oficiales" BOOLEAN NOT NULL DEFAULT true,
    "permite_logo_personalizado" BOOLEAN NOT NULL DEFAULT false,
    "permite_kardex_completo" BOOLEAN NOT NULL DEFAULT false,
    "permite_soporte_prioritario" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: suscripciones_institucion
CREATE TABLE IF NOT EXISTS "suscripciones_institucion" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'TRIAL',
    "periodo_facturacion" "PeriodoFacturacion" NOT NULL DEFAULT 'MENSUAL',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "dias_gracia" INTEGER NOT NULL DEFAULT 5,
    "auto_renovacion" BOOLEAN NOT NULL DEFAULT true,
    "monto_actual" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_institucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: historial_pagos_suscripcion
CREATE TABLE IF NOT EXISTS "historial_pagos_suscripcion" (
    "id" UUID NOT NULL,
    "suscripcion_id" UUID NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'BOB',
    "metodo_pago" "MetodoPagoSaaS" NOT NULL DEFAULT 'QR_SIMPLE',
    "estado" "EstadoPagoSaaS" NOT NULL DEFAULT 'PENDIENTE',
    "codigo_transaccion" VARCHAR(100) NOT NULL,
    "referencia_bancaria" VARCHAR(100),
    "comprobante_url" VARCHAR(255),
    "fecha_pago" TIMESTAMP(3),
    "observaciones" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historial_pagos_suscripcion_pkey" PRIMARY KEY ("id")
);

-- Unique indices
CREATE UNIQUE INDEX IF NOT EXISTS "planes_suscripcion_codigo_key" ON "planes_suscripcion"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "suscripciones_institucion_institucion_id_key" ON "suscripciones_institucion"("institucion_id");
CREATE UNIQUE INDEX IF NOT EXISTS "historial_pagos_suscripcion_codigo_transaccion_key" ON "historial_pagos_suscripcion"("codigo_transaccion");

-- Regular indices
CREATE INDEX IF NOT EXISTS "suscripciones_institucion_institucion_id_idx" ON "suscripciones_institucion"("institucion_id");
CREATE INDEX IF NOT EXISTS "suscripciones_institucion_plan_id_idx" ON "suscripciones_institucion"("plan_id");
CREATE INDEX IF NOT EXISTS "suscripciones_institucion_estado_idx" ON "suscripciones_institucion"("estado");
CREATE INDEX IF NOT EXISTS "historial_pagos_suscripcion_suscripcion_id_idx" ON "historial_pagos_suscripcion"("suscripcion_id");
CREATE INDEX IF NOT EXISTS "historial_pagos_suscripcion_estado_idx" ON "historial_pagos_suscripcion"("estado");

-- Foreign key constraints
DO $$ BEGIN
    ALTER TABLE "suscripciones_institucion" ADD CONSTRAINT "suscripciones_institucion_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "unidades_educativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "suscripciones_institucion" ADD CONSTRAINT "suscripciones_institucion_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_suscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "historial_pagos_suscripcion" ADD CONSTRAINT "historial_pagos_suscripcion_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripciones_institucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

