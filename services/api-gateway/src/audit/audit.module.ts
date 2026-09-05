import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { AUDIT_LOG_QUEUE } from '@dexago/shared';
import { AuditService } from './audit.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: AUDIT_LOG_QUEUE }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production-please',
    }),
  ],
  providers: [AuditService],
  controllers: [NotificationsController],
  exports: [AuditService],
})
export class AuditModule {}
