import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PeriodoFacturacion, EstadoSuscripcion, MetodoPagoSaaS, EstadoPagoSaaS } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Catálogo público de planes SaaS
   */
  async getPublicPlans() {
    return this.prisma.planSuscripcion.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  }

  /**
   * Obtener suscripción actual de una Unidad Educativa con métricas de consumo
   */
  async getCurrentSubscription(institucionId: string) {
    let suscripcion = await this.prisma.suscripcionInstitucion.findUnique({
      where: { institucionId },
      include: {
        plan: true,
        pagos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Si la institución no tiene suscripción aún, inicializar con Trial Pro de 14 días
    if (!suscripcion) {
      const planPro = await this.prisma.planSuscripcion.findFirst({
        where: { codigo: 'PLAN_PRO' },
      });

      if (planPro) {
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 14);

        suscripcion = await this.prisma.suscripcionInstitucion.create({
          data: {
            institucionId,
            planId: planPro.id,
            estado: EstadoSuscripcion.TRIAL,
            periodoFacturacion: PeriodoFacturacion.MENSUAL,
            fechaFin,
            montoActual: planPro.precioMensual,
          },
          include: {
            plan: true,
            pagos: true,
          },
        });
      }
    }

    if (!suscripcion) {
      throw new NotFoundException('No se encontró configuración de suscripción para esta institución.');
    }

    // Contadores de consumo real
    const totalEstudiantes = await this.prisma.inscripcion.count({
      where: { institucionId, activo: true },
    });

    const totalDocentes = await this.prisma.vinculacionInstitucional.count({
      where: { institucionId, estado: 'ACTIVO' },
    });

    const ahora = new Date();
    const fin = new Date(suscripcion.fechaFin);
    const diffMs = fin.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let estadoCalculado = suscripcion.estado;
    if (diasRestantes <= 0) {
      if (Math.abs(diasRestantes) <= suscripcion.diasGracia) {
        estadoCalculado = EstadoSuscripcion.GRACIA;
      } else {
        estadoCalculado = EstadoSuscripcion.VENCIDA;
      }
    }

    return {
      suscripcion: {
        ...suscripcion,
        estado: estadoCalculado,
        diasRestantes: Math.max(0, diasRestantes),
      },
      metricasUso: {
        estudiantes: {
          actual: totalEstudiantes,
          limite: suscripcion.plan.maxEstudiantes,
          porcentaje: Math.min(100, Math.round((totalEstudiantes / suscripcion.plan.maxEstudiantes) * 100)),
        },
        docentes: {
          actual: totalDocentes,
          limite: suscripcion.plan.maxDocentes,
          porcentaje: Math.min(100, Math.round((totalDocentes / suscripcion.plan.maxDocentes) * 100)),
        },
      },
    };
  }

  /**
   * Generar intención de pago mediante QR Simple Interoperable Boliviano
   */
  async generateQrPaymentIntent(institucionId: string, planCodigo: string, periodo: PeriodoFacturacion) {
    const plan = await this.prisma.planSuscripcion.findUnique({
      where: { codigo: planCodigo },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planCodigo} no encontrado.`);
    }

    const institucion = await this.prisma.unidadEducativa.findUnique({
      where: { id: institucionId },
    });

    if (!institucion) {
      throw new NotFoundException('Unidad Educativa no encontrada.');
    }

    // Determinar monto según período
    const monto = periodo === PeriodoFacturacion.ANUAL ? plan.precioAnual : plan.precioMensual;

    // Obtener o crear suscripción
    let suscripcion = await this.prisma.suscripcionInstitucion.findUnique({
      where: { institucionId },
    });

    if (!suscripcion) {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + (periodo === PeriodoFacturacion.ANUAL ? 365 : 30));

      suscripcion = await this.prisma.suscripcionInstitucion.create({
        data: {
          institucionId,
          planId: plan.id,
          estado: EstadoSuscripcion.TRIAL,
          periodoFacturacion: periodo,
          fechaFin,
          montoActual: monto,
        },
      });
    }

    // Generar código de transacción único boliviano
    const rawCode = `SIGMA-${institucion.sie}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const codigoTransaccion = rawCode.substring(0, 30);

    // Formato estándar Simple QR Bolivia (JSON interoperable BCB / ASOBAN)
    const qrPayload = JSON.stringify({
      version: '1.0',
      beneficiario: 'SIGMA-SEP GESTION EDUCATIVA SAAS',
      cuenta: '10000049281726 (Banco Unión / Interoperable)',
      moneda: 'BOB',
      monto: Number(monto),
      glosa: `Suscrip ${plan.nombre} SIE:${institucion.sie}`,
      transaccionId: codigoTransaccion,
      vencimiento: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    });

    const pago = await this.prisma.historialPagoSuscripcion.create({
      data: {
        suscripcionId: suscripcion.id,
        monto,
        moneda: 'BOB',
        metodoPago: MetodoPagoSaaS.QR_SIMPLE,
        estado: EstadoPagoSaaS.PENDIENTE,
        codigoTransaccion,
        observaciones: `Plan: ${plan.nombre} (${periodo})`,
      },
    });

    return {
      codigoTransaccion,
      monto,
      moneda: 'BOB',
      planNombre: plan.nombre,
      periodo,
      qrPayload,
      qrImageUrl: null,
      beneficiario: 'SIGMA Plataforma Educativa Bolivia',
      cuentaDestino: 'Banco Unión Cta Cte: 10000049281726',
      pagoId: pago.id,
    };
  }

  /**
   * Confirmar pago (Manual / Aprobación por comprobante o Webhook)
   */
  async confirmPayment(codigoTransaccion: string, referenciaBancaria?: string, comprobanteUrl?: string) {
    const pago = await this.prisma.historialPagoSuscripcion.findUnique({
      where: { codigoTransaccion },
      include: {
        suscripcion: {
          include: { plan: true },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException(`Transacción ${codigoTransaccion} no encontrada.`);
    }

    if (pago.estado === EstadoPagoSaaS.APROBADO) {
      return { message: 'El pago ya se encuentra aprobado.', pago };
    }

    const nuevaFechaFin = new Date();
    if (pago.suscripcion.periodoFacturacion === PeriodoFacturacion.ANUAL) {
      nuevaFechaFin.setFullYear(nuevaFechaFin.getFullYear() + 1);
    } else {
      nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1);
    }

    // Actualizar suscripción y pago en transacción atómica
    const [pagoActualizado] = await this.prisma.$transaction([
      this.prisma.historialPagoSuscripcion.update({
        where: { id: pago.id },
        data: {
          estado: EstadoPagoSaaS.APROBADO,
          fechaPago: new Date(),
          referenciaBancaria: referenciaBancaria || 'VALIDADO_QR_SIMPLE',
          comprobanteUrl,
        },
      }),
      this.prisma.suscripcionInstitucion.update({
        where: { id: pago.suscripcionId },
        data: {
          estado: EstadoSuscripcion.ACTIVA,
          fechaFin: nuevaFechaFin,
        },
      }),
    ]);

    return {
      message: '¡Pago aprobado con éxito! La suscripción institucional ha sido activada.',
      pago: pagoActualizado,
      fechaVencimiento: nuevaFechaFin,
    };
  }

  /**
   * Reporte global de métricas SaaS para el Superadmin
   */
  async getAdminOverview() {
    const totalInstituciones = await this.prisma.unidadEducativa.count();
    const totalSuscripciones = await this.prisma.suscripcionInstitucion.count();
    const activas = await this.prisma.suscripcionInstitucion.count({
      where: { estado: EstadoSuscripcion.ACTIVA },
    });
    const trials = await this.prisma.suscripcionInstitucion.count({
      where: { estado: EstadoSuscripcion.TRIAL },
    });

    // Calcular MRR aproximado
    const suscripcionesActivas = await this.prisma.suscripcionInstitucion.findMany({
      where: { estado: EstadoSuscripcion.ACTIVA },
      include: { plan: true },
    });

    let mrr = 0;
    for (const sub of suscripcionesActivas) {
      if (sub.periodoFacturacion === PeriodoFacturacion.ANUAL) {
        mrr += Number(sub.plan.precioAnual) / 12;
      } else {
        mrr += Number(sub.plan.precioMensual);
      }
    }

    // Últimos pagos registrados
    const ultimosPagos = await this.prisma.historialPagoSuscripcion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        suscripcion: {
          include: {
            institucion: { select: { nombre: true, sie: true } },
            plan: { select: { nombre: true } },
          },
        },
      },
    });

    return {
      totalInstituciones,
      totalSuscripciones,
      activas,
      trials,
      mrrEstimadoBOB: Math.round(mrr * 100) / 100,
      arrEstimadoBOB: Math.round(mrr * 12 * 100) / 100,
      ultimosPagos,
    };
  }
}
