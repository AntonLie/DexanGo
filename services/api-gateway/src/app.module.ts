import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';
import { redisConnection } from './redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: redisConnection(),
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
