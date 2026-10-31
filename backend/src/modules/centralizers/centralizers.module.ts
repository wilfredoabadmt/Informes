import { Module } from '@nestjs/common';
import { CentralizersController } from './centralizers.controller';
import { CentralizersService } from './centralizers.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CentralizersController],
  providers: [CentralizersService],
  exports: [CentralizersService],
})
export class CentralizersModule {}
