import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  RolGlobal,
  RolInstitucional,
  TipoAuditoria,
} from '@prisma/client';
import { QueryAuditLogsDto, QueryAuditStatsDto } from './dto';

export interface CreateAuditLogDto {
  usuarioId?: string;
  institucionId?: string;
  tipo: TipoAuditoria;
  accion: string;
  detalle?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export interface ActorContext {
  userId: string;
  globalRole: RolGlobal;
  institutionId?: string;
  userRole?: RolInstitucional;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría en la base de datos de forma persistente e inmutable.
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
      this.logger.error(`Error guardando registro de auditoría: ${error.message}`, error.stack);
    }
  }

  /**
   * Consulta paginada de registros de auditoría aplicando RBAC y aislamiento institucional
   */
  async findLogs(query: QueryAuditLogsDto, actor: ActorContext) {
    this.validateActorAccess(actor);

    let targetInstitutionId: string | undefined;

    if (actor.globalRole === RolGlobal.INSTITUTIONAL_USER) {
      targetInstitutionId = actor.institutionId;
    } else {
      // Nivel 1 (SUPERADMIN / CENTRAL_ADMIN)
      targetInstitutionId = query.institucionId || actor.institutionId;

      // Principio 7: Auditoría del privilegio central cuando la consulta es global
      if (!targetInstitutionId) {
        await this.log({
          usuarioId: actor.userId,
          tipo: TipoAuditoria.SECURITY_VIOLATION,
          accion: 'GLOBAL_AUDIT_INSPECTED',
          detalle: {
            page: query.page,
            limit: query.limit,
            filtros: {
              tipo: query.tipo,
              accion: query.accion,
              usuarioId: query.usuarioId,
            },
          },
        });
      }
    }

    const where: Prisma.RegistroAuditoriaWhereInput = {};

    if (targetInstitutionId) {
      where.institucionId = targetInstitutionId;
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.accion) {
      where.accion = { contains: query.accion, mode: 'insensitive' };
    }

    if (query.usuarioId) {
      where.usuarioId = query.usuarioId;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.timestamp = {};
      if (query.fechaDesde) where.timestamp.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.timestamp.lte = new Date(query.fechaHasta);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.registroAuditoria.count({ where }),
      this.prisma.registroAuditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              persona: {
                select: {
                  nombres: true,
                  primerApellido: true,
                  segundoApellido: true,
                },
              },
            },
          },
          institucion: {
            select: {
              id: true,
              sie: true,
              nombre: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Consulta el detalle de un evento por ID
   */
  async findLogById(id: string, actor: ActorContext) {
    this.validateActorAccess(actor);

    const log = await this.prisma.registroAuditoria.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            persona: {
              select: {
                nombres: true,
                primerApellido: true,
                segundoApellido: true,
              },
            },
          },
        },
        institucion: {
          select: {
            id: true,
            sie: true,
            nombre: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }

    // Aislamiento institucional
    if (actor.globalRole === RolGlobal.INSTITUTIONAL_USER && log.institucionId !== actor.institutionId) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }

    return log;
  }

  /**
   * Obtiene estadísticas agregadas de auditoría
   */
  async getStats(query: QueryAuditStatsDto, actor: ActorContext) {
    this.validateActorAccess(actor);

    let targetInstitutionId: string | undefined;

    if (actor.globalRole === RolGlobal.INSTITUTIONAL_USER) {
      targetInstitutionId = actor.institutionId;
    } else {
      targetInstitutionId = query.institucionId || actor.institutionId;
    }

    const where: Prisma.RegistroAuditoriaWhereInput = {};

    if (targetInstitutionId) {
      where.institucionId = targetInstitutionId;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.timestamp = {};
      if (query.fechaDesde) where.timestamp.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.timestamp.lte = new Date(query.fechaHasta);
    }

    const totalEventos = await this.prisma.registroAuditoria.count({ where });

    // Conteo agrupado por tipo
    const logsPorTipo = await this.prisma.registroAuditoria.groupBy({
      by: ['tipo'],
      where,
      _count: { tipo: true },
    });

    const porTipo: Record<string, number> = {};
    logsPorTipo.forEach((item) => {
      porTipo[item.tipo] = item._count.tipo;
    });

    // Top acciones
    const logsPorAccion = await this.prisma.registroAuditoria.groupBy({
      by: ['accion'],
      where,
      _count: { accion: true },
      orderBy: {
        _count: {
          accion: 'desc',
        },
      },
      take: 5,
    });

    const topAcciones = logsPorAccion.map((item) => ({
      accion: item.accion,
      cantidad: item._count.accion,
    }));

    return {
      totalEventos,
      porTipo,
      topAcciones,
    };
  }

  private validateActorAccess(actor: ActorContext) {
    if (actor.globalRole === RolGlobal.SUPERADMIN || actor.globalRole === RolGlobal.CENTRAL_ADMIN) {
      return;
    }

    if (actor.globalRole === RolGlobal.INSTITUTIONAL_USER) {
      if (
        actor.userRole === RolInstitucional.DIRECTOR ||
        actor.userRole === RolInstitucional.ADMIN_INSTITUCIONAL
      ) {
        return;
      }
    }

    throw new ForbiddenException(
      'Permiso denegado: solo personal directivo o administradores centrales pueden consultar la auditoría',
    );
  }
}
