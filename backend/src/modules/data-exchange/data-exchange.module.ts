import { Module } from '@nestjs/common';
import { DataExchangeController } from './data-exchange.controller';
import { DataExchangeService } from './data-exchange.service';
import { SpreadsheetParserService } from './spreadsheet-parser.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [DataExchangeController],
  providers: [DataExchangeService, SpreadsheetParserService],
  exports: [DataExchangeService, SpreadsheetParserService],
})
export class DataExchangeModule {}
