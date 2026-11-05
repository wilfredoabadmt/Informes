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

    // Detalle por institución con métricas individuales
    const detallePorInstitucion = await this.prisma.suscripcionInstitucion.findMany({
      include: {
        institucion: { select: { id: true, sie: true, nombre: true, departamento: true, municipio: true } },
        plan: { select: { nombre: true, codigo: true, precioMensual: true, precioAnual: true } },
        pagos: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, monto: true, estado: true, createdAt: true, codigoTransaccion: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const detalle = detallePorInstitucion.map(sub => {
      const esAnual = sub.periodoFacturacion === PeriodoFacturacion.ANUAL;
      const precio = esAnual ? Number(sub.plan.precioAnual) : Number(sub.plan.precioMensual);
      const mrrIndiv = esAnual ? precio / 12 : precio;
      const fechaFin = new Date(sub.fechaFin);
      const ahora = new Date();
      const diffMs = fechaFin.getTime() - ahora.getTime();
      const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      let estadoCalc = sub.estado;
      if (diasRestantes === 0 && sub.estado === EstadoSuscripcion.ACTIVA) {
        estadoCalc = EstadoSuscripcion.GRACIA;
      } else if (diasRestantes === 0) {
        estadoCalc = EstadoSuscripcion.VENCIDA;
      }

      return {
        institucionId: sub.institucionId,
        sie: sub.institucion.sie,
        nombre: sub.institucion.nombre,
        departamento: sub.institucion.departamento,
        municipio: sub.institucion.municipio,
        planCodigo: sub.plan.codigo,
        planNombre: sub.plan.nombre,
        estado: estadoCalc,
        periodoFacturacion: sub.periodoFacturacion,
        mesesContratados: esAnual ? 12 : 1,
        fechaInicio: sub.fechaInicio,
        fechaFin: sub.fechaFin,
        diasRestantes,
        montoActual: Number(sub.montoActual),
        mrrIndividual: Math.round(mrrIndiv * 100) / 100,
        ultimoPago: sub.pagos[0] || null,
        activo: sub.institucion.activo ?? true,
      };
    });

    // Métricas por mes (últimos 12 meses)
    const ultimos12Meses = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);

      const pagosMes = await this.prisma.historialPagoSuscripcion.count({
        where: {
          estado: EstadoPagoSaaS.APROBADO,
          fechaPago: { gte: inicioMes, lte: finMes },
        },
      });

      const ingresosMes = await this.prisma.historialPagoSuscripcion.aggregate({
        where: {
          estado: EstadoPagoSaaS.APROBADO,
          fechaPago: { gte: inicioMes, lte: finMes },
        },
        _sum: { monto: true },
      });

      ultimos12Meses.push({
        mes: fecha.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' }),
        anioMes: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
        pagos: pagosMes,
        ingresos: Number(ingresosMes._sum.monto || 0),
      });
    }

    return {
      totalInstituciones,
      totalSuscripciones,
      activas,
      trials,
      mrrEstimadoBOB: Math.round(mrr * 100) / 100,
      arrEstimadoBOB: Math.round(mrr * 12 * 100) / 100,
      ultimosPagos,
      detallePorInstitucion: detalle,
      metricasPorMes: ultimos12Meses,
      resumenEstados: {
        activa: detalle.filter(d => d.estado === EstadoSuscripcion.ACTIVA).length,
        trial: detalle.filter(d => d.estado === EstadoSuscripcion.TRIAL).length,
        gracia: detalle.filter(d => d.estado === EstadoSuscripcion.GRACIA).length,
        vencida: detalle.filter(d => d.estado === EstadoSuscripcion.VENCIDA).length,
        cancelada: detalle.filter(d => d.estado === EstadoSuscripcion.CANCELADA).length,
      },
      resumenPlanes: {
        PLAN_PRO: detalle.filter(d => d.planCodigo === 'PLAN_PRO').length,
        PLAN_ENTERPRISE: detalle.filter(d => d.planCodigo === 'PLAN_ENTERPRISE').length,
      },
      resumenPeriodos: {
        MENSUAL: detalle.filter(d => d.periodoFacturacion === PeriodoFacturacion.MENSUAL).length,
        ANUAL: detalle.filter(d => d.periodoFacturacion === PeriodoFacturacion.ANUAL).length,
        SEMESTRAL: detalle.filter(d => d.periodoFacturacion === PeriodoFacturacion.SEMESTRAL).length,
      },
    };
  }
}
