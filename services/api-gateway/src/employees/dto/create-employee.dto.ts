import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from "class-validator";
import { Role } from "@dexago/shared";

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  position: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn([Role.EMPLOYEE, Role.ADMIN])
  role?: Role;
}
