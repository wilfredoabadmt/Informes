import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(' Conectado exitosamente a PostgreSQL (maestros_db)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado de PostgreSQL');
  }

  /**
   * Ejecuta una serie de operaciones dentro de una transacción interactiva con
   * aislamiento estricto de PostgreSQL Row-Level Security (RLS) para la institución dada.
   *
   * @param institutionId UUID de la institución activa
   * @param callback Función de operaciones a ejecutar dentro de la transacción
   */
  async withTenantContext<T>(
    institutionId: string,
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // SET LOCAL ROLE se revierte automáticamente al finalizar la transacción
      await tx.$executeRawUnsafe(`SET LOCAL ROLE maestros_app;`);
      // Inyectar el parámetro de sesión local para RLS
      await tx.$executeRawUnsafe(`SET LOCAL app.current_institution_id = '${institutionId}';`);
      await tx.$executeRawUnsafe(`SET LOCAL app.bypass_rls = 'false';`);
      return callback(tx as any);
    });
  }

  /**
   * Ejecuta operaciones con bypass explícito y auditado de RLS (sólo para Superadministradores).
   *
   * @param callback Función de operaciones a ejecutar
   */
  async withBypassRls<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.bypass_rls = 'true';`);
      return callback(tx as any);
    });
  }
}
