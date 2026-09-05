import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthResponse, EmployeeProfile, Role } from '@dexago/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toEmployeeProfile } from '../common/mappers';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const employee = await this.prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role as Role,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    });

    return { accessToken, user: toEmployeeProfile(employee) };
  }

  async me(userId: string): Promise<EmployeeProfile> {
    const employee = await this.prisma.employee.findUnique({ where: { id: userId } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return toEmployeeProfile(employee);
  }
}
