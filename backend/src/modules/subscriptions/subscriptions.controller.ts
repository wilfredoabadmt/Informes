import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CentralAdminGuard } from '../../common/guards/central-admin.guard';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { PeriodoFacturacion } from '@prisma/client';

@ApiTags('SaaS & Suscripciones')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Obtener catálogo público de planes SaaS para Bolivia' })
  async getPlans() {
    return this.subscriptionsService.getPublicPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Institution-Id', required: true })
  @ApiOperation({ summary: 'Obtener suscripción y cuotas de uso de la institución activa' })
  async getCurrentSubscription(@CurrentTenant() tenant: TenantContext) {
    return this.subscriptionsService.getCurrentSubscription(tenant.institutionId);
  }

  @Post('payments/qr-intent')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Institution-Id', required: true })
  @ApiOperation({ summary: 'Generar código e imagen QR Simple interoperable para suscripción' })
  async generateQrIntent(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { planCodigo: string; periodo: PeriodoFacturacion },
  ) {
    return this.subscriptionsService.generateQrPaymentIntent(
      tenant.institutionId,
      body.planCodigo || 'PLAN_PRO',
      body.periodo || PeriodoFacturacion.ANUAL,
    );
  }

  @Post('payments/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar pago mediante código de transacción o comprobante' })
  async confirmPayment(
    @Body() body: { codigoTransaccion: string; referenciaBancaria?: string; comprobanteUrl?: string },
  ) {
    return this.subscriptionsService.confirmPayment(
      body.codigoTransaccion,
      body.referenciaBancaria,
      body.comprobanteUrl,
    );
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Panel de métricas globales SaaS (MRR, ARR, Colegios Activos)' })
  async getAdminOverview() {
    return this.subscriptionsService.getAdminOverview();
  }
}
