import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Subject, Observable } from "rxjs";
import { randomUUID } from "crypto";
import {
  AUDIT_LOG_QUEUE,
  AUDIT_LOG_JOB,
  AuditLogEvent,
  AdminNotification,
} from "@dexago/shared";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly notifications$ = new Subject<AdminNotification>();

  constructor(@InjectQueue(AUDIT_LOG_QUEUE) private readonly queue: Queue) {}

  async record(event: AuditLogEvent): Promise<void> {
    try {
      await this.queue.add(AUDIT_LOG_JOB, event, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue audit event: ${(err as Error).message}`,
      );
    }

    const notification: AdminNotification = {
      id: randomUUID(),
      action: event.action,
      employeeId: event.employeeId,
      employeeName: event.employeeName,
      employeeEmail: event.employeeEmail,
      message: event.message,
      occurredAt: event.occurredAt,
    };
    this.notifications$.next(notification);
  }

  stream(): Observable<AdminNotification> {
    return this.notifications$.asObservable();
  }
}
