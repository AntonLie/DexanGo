import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AttendanceStatus as PrismaAttendanceStatus } from "../../generated/prisma";
import {
  AttendanceStatus,
  AttendanceRecord,
  AttendanceSummaryRow,
  AttendanceSummaryPage,
  AttendanceWithEmployee,
  AttendanceSortField,
  SortDir,
  TodayAttendance,
  Paginated,
} from "@dexago/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ymd, todayYmd, startOfMonthYmd, isYmd } from "../common/date.util";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(employeeId: string): Promise<AttendanceRecord> {
    const date = todayYmd();
    const existing = await this.prisma.attendance.findFirst({
      where: { employeeId, date, status: PrismaAttendanceStatus.IN },
    });
    if (existing) {
      throw new ConflictException("You have already checked in today");
    }
    const record = await this.prisma.attendance.create({
      data: {
        employeeId,
        status: PrismaAttendanceStatus.IN,
        timestamp: new Date(),
        date,
      },
    });
    return this.toRecord(record);
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    const date = todayYmd();
    const checkedIn = await this.prisma.attendance.findFirst({
      where: { employeeId, date, status: PrismaAttendanceStatus.IN },
    });
    if (!checkedIn) {
      throw new BadRequestException("You must check in before checking out");
    }
    const alreadyOut = await this.prisma.attendance.findFirst({
      where: { employeeId, date, status: PrismaAttendanceStatus.OUT },
    });
    if (alreadyOut) {
      throw new ConflictException("You have already checked out today");
    }
    const record = await this.prisma.attendance.create({
      data: {
        employeeId,
        status: PrismaAttendanceStatus.OUT,
        timestamp: new Date(),
        date,
      },
    });
    return this.toRecord(record);
  }

  async today(employeeId: string): Promise<TodayAttendance> {
    const date = todayYmd();
    const records = await this.prisma.attendance.findMany({
      where: { employeeId, date },
      orderBy: { timestamp: "asc" },
    });
    const inRec = records.find((r) => r.status === PrismaAttendanceStatus.IN);
    const outRec = records.find((r) => r.status === PrismaAttendanceStatus.OUT);
    return {
      date,
      checkedIn: !!inRec,
      checkedOut: !!outRec,
      checkInTime: inRec ? inRec.timestamp.toISOString() : null,
      checkOutTime: outRec ? outRec.timestamp.toISOString() : null,
    };
  }

  async summary(
    employeeId: string,
    opts: { from?: string; to?: string; cursor?: string; limit?: number } = {},
  ): Promise<AttendanceSummaryPage> {
    const start = isYmd(opts.from) ? opts.from : startOfMonthYmd();
    const end = isYmd(opts.to) ? opts.to : todayYmd();
    if (start > end) {
      throw new BadRequestException('"from" date must be before "to" date');
    }
    const limit = Math.min(
      Math.max(Math.trunc(Number(opts.limit)) || 8, 1),
      50,
    );

    // Page over distinct days (newest first). `date` is a zero-padded
    // YYYY-MM-DD string, so lexical comparison is chronological.
    const dateFilter: { gte: string; lte: string; lt?: string } = {
      gte: start,
      lte: end,
    };
    if (isYmd(opts.cursor)) dateFilter.lt = opts.cursor;

    const days = await this.prisma.attendance.groupBy({
      by: ["date"],
      where: { employeeId, date: dateFilter },
      orderBy: { date: "desc" },
      take: limit + 1, // one extra row tells us whether another page exists
    });

    const hasMore = days.length > limit;
    const pageDates = days.slice(0, limit).map((d) => d.date);
    if (pageDates.length === 0) {
      return { rows: [], nextCursor: null };
    }

    const records = await this.prisma.attendance.findMany({
      where: { employeeId, date: { in: pageDates } },
      orderBy: { timestamp: "asc" },
    });

    const byDate = new Map<string, AttendanceSummaryRow>();
    for (const r of records) {
      const row = byDate.get(r.date) ?? {
        date: r.date,
        checkIn: null,
        checkOut: null,
      };
      if (r.status === PrismaAttendanceStatus.IN) {
        // earliest check-in
        if (!row.checkIn || r.timestamp.toISOString() < row.checkIn) {
          row.checkIn = r.timestamp.toISOString();
        }
      } else {
        // latest check-out
        if (!row.checkOut || r.timestamp.toISOString() > row.checkOut) {
          row.checkOut = r.timestamp.toISOString();
        }
      }
      byDate.set(r.date, row);
    }

    // Keep the newest-first order from the keyset query.
    const rows = pageDates.map(
      (date) => byDate.get(date) ?? { date, checkIn: null, checkOut: null },
    );
    return {
      rows,
      nextCursor: hasMore ? pageDates[pageDates.length - 1] : null,
    };
  }

  // Admin monitoring (read-only)

  async findAll(params: {
    from?: string;
    to?: string;
    employeeId?: string;
    page?: number;
    limit?: number;
    sort?: AttendanceSortField;
    dir?: SortDir;
  }): Promise<Paginated<AttendanceWithEmployee>> {
    const page = Math.max(1, Math.trunc(Number(params.page)) || 1);
    const limit = Math.min(
      Math.max(Math.trunc(Number(params.limit)) || 10, 1),
      100,
    );

    const dir: SortDir = params.dir === "asc" ? "asc" : "desc";
    const orderBy =
      params.sort === "employeeName"
        ? { employee: { name: dir } }
        : params.sort === "status"
          ? { status: dir }
          : { timestamp: dir };

    const where: any = {};
    if (isYmd(params.from) || isYmd(params.to)) {
      where.date = {};
      if (isYmd(params.from)) where.date.gte = params.from;
      if (isYmd(params.to)) where.date.lte = params.to;
    }
    if (params.employeeId) where.employeeId = params.employeeId;

    const [total, records] = await this.prisma.$transaction([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        orderBy,
        include: { employee: { select: { name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: records.map((r) => ({
        ...this.toRecord(r),
        employeeName: r.employee.name,
        employeeEmail: r.employee.email,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  // Helpers

  private toRecord(r: {
    id: string;
    employeeId: string;
    status: PrismaAttendanceStatus;
    timestamp: Date;
    date: string;
  }): AttendanceRecord {
    return {
      id: r.id,
      employeeId: r.employeeId,
      status: r.status as AttendanceStatus,
      timestamp: r.timestamp.toISOString(),
      date: r.date,
    };
  }
}
