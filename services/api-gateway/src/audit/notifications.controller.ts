import {
  Controller,
  Sse,
  Query,
  MessageEvent,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable, merge, interval, map } from "rxjs";
import { Role } from "@dexago/shared";
import { AuditService } from "./audit.service";

@Controller()
export class NotificationsController {
  constructor(
    private readonly audit: AuditService,
    private readonly jwt: JwtService,
  ) {}

  @Sse("notifications/stream")
  stream(@Query("token") token: string): Observable<MessageEvent> {
    let payload: { sub: string; role: Role };
    try {
      payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET ?? "change-me-in-production-please",
      });
    } catch {
      throw new UnauthorizedException("Invalid or missing token");
    }
    if (payload.role !== Role.ADMIN) {
      throw new UnauthorizedException("Admin access required");
    }

    const events$ = this.audit
      .stream()
      .pipe(map((n): MessageEvent => ({ data: n })));

    const heartbeat$ = interval(25000).pipe(
      map((): MessageEvent => ({ type: "ping", data: { t: "keepalive" } })),
    );

    return merge(events$, heartbeat$);
  }
}
