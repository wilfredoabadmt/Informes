import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService, TenantContextGuard],
  exports: [AcademicService],
})
export class AcademicModule {}
