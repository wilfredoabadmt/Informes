import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Validación de Aislamiento Tenant')
@Controller('tenant-test')
export class TenantTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('isolated-data')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución bajo prueba',
    required: true,
  })
  @ApiOperation({ summary: 'Endpoint de verificación de contexto y RLS' })
  async getTenantData(@CurrentTenant() tenant: TenantContext) {
    // Consulta protegida bajo PostgreSQL Row Level Security interactivo
    const vinculacionesEnTenant = await this.prisma.withTenantContext(
      tenant.institutionId,
      async (tx) => {
        return tx.vinculacionInstitucional.findMany({
          select: {
            id: true,
            institucionId: true,
            rolInstitucional: true,
            cargoOficial: true,
            usuario: {
              select: {
                email: true,
              },
            },
          },
        });
      },
    );

    return {
      message: 'Acceso autorizado bajo contexto institucional.',
      tenant,
      totalRegistrosAislados: vinculacionesEnTenant.length,
      vinculaciones: vinculacionesEnTenant,
    };
  }
}
