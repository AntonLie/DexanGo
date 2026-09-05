import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AUDIT_LOG_QUEUE } from '@dexago/shared';
import { AuditProcessor } from './audit.processor';

@Module({
  imports: [BullModule.registerQueue({ name: AUDIT_LOG_QUEUE })],
  providers: [AuditProcessor],
})
export class AuditModule {}
