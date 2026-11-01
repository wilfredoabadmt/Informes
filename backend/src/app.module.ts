import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AcademicModule } from './modules/academic/academic.module';
import { StudentsModule } from './modules/students/students.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { GradesModule } from './modules/grades/grades.module';
import { CentralizersModule } from './modules/centralizers/centralizers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DataExchangeModule } from './modules/data-exchange/data-exchange.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    InstitutionsModule,
    TeachersModule,
    AcademicModule,
    StudentsModule,
    AttendanceModule,
    EvaluationsModule,
    GradesModule,
    CentralizersModule,
    ReportsModule,
    DataExchangeModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}

