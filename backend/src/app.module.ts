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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    InstitutionsModule,
    TeachersModule,
    AcademicModule,
    StudentsModule,
    AttendanceModule,
  ],
})
export class AppModule {}

