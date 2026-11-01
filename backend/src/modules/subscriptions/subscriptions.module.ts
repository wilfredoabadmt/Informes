import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

