import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { AUDIT_LOG_QUEUE, AuditLogEvent } from "@dexago/shared";
import { LogPrismaService } from "../prisma/prisma.service";

@Processor(AUDIT_LOG_QUEUE)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly prisma: LogPrismaService) {
    super();
  }

  async process(job: Job<AuditLogEvent>): Promise<{ id: string }> {
    const e = job.data;
    const saved = await this.prisma.auditLog.create({
      data: {
        action: e.action,
        employeeId: e.employeeId,
        employeeEmail: e.employeeEmail,
        employeeName: e.employeeName,
        message: e.message,
        changes: e.changes ? JSON.stringify(e.changes) : null,
        occurredAt: new Date(e.occurredAt),
      },
    });
    return { id: saved.id };
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<AuditLogEvent>) {
    this.logger.log(
      `Audit logged: ${job.data.action} for ${job.data.employeeEmail}`,
    );
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<AuditLogEvent>, err: Error) {
    this.logger.error(`Audit job ${job.id} failed: ${err.message}`);
  }
}
