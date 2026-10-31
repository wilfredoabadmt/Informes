import { Module } from '@nestjs/common';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { CentralAdminGuard } from '../../common/guards/central-admin.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';

@Module({
  controllers: [InstitutionsController],
  providers: [InstitutionsService, CentralAdminGuard, TenantContextGuard],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
