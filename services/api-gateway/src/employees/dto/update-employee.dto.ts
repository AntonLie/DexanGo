import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { Role } from '@dexago/shared';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  position?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn([Role.EMPLOYEE, Role.ADMIN])
  role?: Role;
}
