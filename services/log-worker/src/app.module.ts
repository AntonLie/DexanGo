import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LogPrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';
import { redisConnection } from './redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: redisConnection(),
    }),
    LogPrismaModule,
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
