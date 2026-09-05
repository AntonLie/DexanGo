import { Controller, Get, Post, Query, UseGuards, HttpCode } from '@nestjs/common';
import {
  AttendanceRecord,
  AttendanceSummaryPage,
  AttendanceWithEmployee,
  AttendanceSortField,
  SortDir,
  TodayAttendance,
  Paginated,
  Role,
} from '@dexago/shared';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  // Employee

  @Post('check-in')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  checkIn(@CurrentUser() user: AuthUser): Promise<AttendanceRecord> {
    return this.attendance.checkIn(user.id);
  }

  @Post('check-out')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  checkOut(@CurrentUser() user: AuthUser): Promise<AttendanceRecord> {
    return this.attendance.checkOut(user.id);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  today(@CurrentUser() user: AuthUser): Promise<TodayAttendance> {
    return this.attendance.today(user.id);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  summary(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<AttendanceSummaryPage> {
    return this.attendance.summary(user.id, {
      from,
      to,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // Admin (read-only monitoring)

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
  ): Promise<Paginated<AttendanceWithEmployee>> {
    return this.attendance.findAll({
      from,
      to,
      employeeId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as AttendanceSortField | undefined,
      dir: dir as SortDir | undefined,
    });
  }
}
