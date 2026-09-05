import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Employee } from '../../generated/prisma';
import * as bcrypt from 'bcryptjs';
import {
  EmployeeProfile,
  Role,
  AuditAction,
  AuditLogEvent,
  Paginated,
  EmployeeSortField,
  SortDir,
} from '@dexago/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toEmployeeProfile } from '../common/mappers';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}


  async updateOwnProfile(userId: string, dto: UpdateProfileDto): Promise<EmployeeProfile> {
    const current = await this.getOrThrow(userId);

    const data: Prisma.EmployeeUpdateInput = {};
    const events: AuditLogEvent[] = [];

    if (dto.phone !== undefined && dto.phone !== current.phone) {
      data.phone = dto.phone;
      events.push(
        this.buildEvent(current, AuditAction.PROFILE_PHONE_UPDATED, 'Phone number updated', {
          phone: { from: current.phone, to: dto.phone },
        }),
      );
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
      events.push(
        this.buildEvent(current, AuditAction.PROFILE_PASSWORD_UPDATED, 'Password changed'),
      );
    }

    if (Object.keys(data).length === 0) {
      return toEmployeeProfile(current);
    }

    const updated = await this.prisma.employee.update({
      where: { id: userId },
      data,
    });

    await this.emit(events);
    return toEmployeeProfile(updated);
  }

  async updateOwnPhoto(userId: string, relativePath: string): Promise<EmployeeProfile> {
    const current = await this.getOrThrow(userId);

    const updated = await this.prisma.employee.update({
      where: { id: userId },
      data: { photoUrl: relativePath },
    });

    await this.emit([
      this.buildEvent(current, AuditAction.PROFILE_PHOTO_UPDATED, 'Profile photo updated'),
    ]);

    return toEmployeeProfile(updated);
  }

  // Admin (HRD) CRUD

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: EmployeeSortField;
    dir?: SortDir;
  } = {}): Promise<Paginated<EmployeeProfile>> {
    const page = Math.max(1, Math.trunc(Number(params.page)) || 1);
    const limit = Math.min(Math.max(Math.trunc(Number(params.limit)) || 10, 1), 100);

    const sortable = ['name', 'email', 'position', 'role', 'createdAt'];
    const sort = sortable.includes(params.sort ?? '') ? (params.sort as string) : 'createdAt';
    const dir: SortDir = params.dir === 'asc' ? 'asc' : 'desc';

    const where: Prisma.EmployeeWhereInput = {};
    const q = params.search?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: employees.map(toEmployeeProfile),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string): Promise<EmployeeProfile> {
    const employee = await this.getOrThrow(id);
    return toEmployeeProfile(employee);
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeProfile> {
    const password = await bcrypt.hash(dto.password, 10);
    try {
      const employee = await this.prisma.employee.create({
        data: {
          name: dto.name,
          email: dto.email,
          position: dto.position,
          phone: dto.phone ?? null,
          password,
          role: (dto.role ?? Role.EMPLOYEE) as any,
        },
      });
      return toEmployeeProfile(employee);
    } catch (e) {
      throw this.mapPrismaError(e);
    }
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeProfile> {
    await this.getOrThrow(id);

    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role as any;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    try {
      const employee = await this.prisma.employee.update({ where: { id }, data });
      return toEmployeeProfile(employee);
    } catch (e) {
      throw this.mapPrismaError(e);
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.getOrThrow(id);
    await this.prisma.employee.delete({ where: { id } });
    return { id };
  }

  // Helpers

  private async getOrThrow(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  private buildEvent(
    employee: Employee,
    action: AuditAction,
    message: string,
    changes?: AuditLogEvent['changes'],
  ): AuditLogEvent {
    return {
      action,
      employeeId: employee.id,
      employeeEmail: employee.email,
      employeeName: employee.name,
      message,
      changes,
      occurredAt: new Date().toISOString(),
    };
  }

  private async emit(events: AuditLogEvent[]): Promise<void> {
    for (const event of events) {
      await this.audit.record(event);
    }
  }

  private mapPrismaError(e: unknown): Error {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new ConflictException('Email already in use');
    }
    return e as Error;
  }
}
