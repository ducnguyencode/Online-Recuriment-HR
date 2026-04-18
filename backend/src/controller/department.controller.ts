/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { DepartmentCreateDto } from 'src/dto/department.create.dto';
import { Department } from 'src/entities/department.entity';
import { ApiResponse } from 'src/helper/api-response';
import { DepartmentService } from 'src/services/department.service';

@Controller('department')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Post('create')
  async create(
    @Body() deparmentCreateDto: DepartmentCreateDto,
  ): Promise<ApiResponse<Department>> {
    const data = await this.departmentService.create(deparmentCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a department',
      data,
    };
  }

  @Get()
  async findAll(): Promise<ApiResponse<Department[]>> {
    const data = await this.departmentService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Get departments successfully',
      data,
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  async changeStatus(@Param('id') id: string, @Body('status') status: boolean) {
    const data = await this.departmentService.changeStatus(Number(id), status);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change applicant status',
      data,
    };
  }
}
