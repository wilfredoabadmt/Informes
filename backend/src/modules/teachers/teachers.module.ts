import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { AuthModule } from '../auth/auth.module';
import { CentralAdminGuard } from '../../common/guards/central-admin.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';

@Module({
  imports: [AuthModule],
  controllers: [TeachersController],
  providers: [TeachersService, CentralAdminGuard, TenantContextGuard],
  exports: [TeachersService],
})
export class TeachersModule {}
