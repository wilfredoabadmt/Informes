import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TipoAuditoria, Prisma } from '@prisma/client';

export interface CreateAuditLogDto {
  usuarioId?: string;
  institucionId?: string;
  tipo: TipoAuditoria;
  accion: string;
  detalle?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría en la base de datos de forma persistente.
   */
  async log(entry: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.registroAuditoria.create({
        data: {
          usuarioId: entry.usuarioId || null,
          institucionId: entry.institucionId || null,
          tipo: entry.tipo,
          accion: entry.accion,
          detalle: entry.detalle ? (entry.detalle as Prisma.InputJsonValue) : Prisma.JsonNull,
          ip: entry.ip || null,
          userAgent: entry.userAgent || null,
        },
      });
      this.logger.debug(`[AUDIT] ${entry.tipo} - ${entry.accion} (User: ${entry.usuarioId || 'ANON'})`);
    } catch (error) {
      // Nunca detener la ejecución si falla el log de auditoría, pero advertir fuertemente
      this.logger.error(`Error guardando registro de auditoría: ${error.message}`, error.stack);
    }
  }
}

