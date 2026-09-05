import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  EmployeeProfile,
  Role,
  Paginated,
  EmployeeSortField,
  SortDir,
} from '@dexago/shared';
import { EmployeesService } from './employees.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { photoMulterOptions } from '../common/upload.config';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  // Self-service (any logged-in employee)

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateOwnProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<EmployeeProfile> {
    return this.employees.updateOwnProfile(user.id, dto);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo', photoMulterOptions))
  updateOwnPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EmployeeProfile> {
    if (!file) {
      throw new BadRequestException('No photo uploaded (field name must be "photo")');
    }
    return this.employees.updateOwnPhoto(user.id, `/uploads/${file.filename}`);
  }

  // Admin (HRD) only

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: EmployeeSortField,
    @Query('dir') dir?: SortDir,
  ): Promise<Paginated<EmployeeProfile>> {
    return this.employees.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      sort,
      dir,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string): Promise<EmployeeProfile> {
    return this.employees.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeProfile> {
    return this.employees.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeProfile> {
    return this.employees.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.employees.remove(id);
  }
}
