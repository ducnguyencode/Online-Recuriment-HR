/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';
import { DepartmentCreateDto } from 'src/dto/department.create.dto';
import { Department } from 'src/entities/department.entity';
import { ApiResponse } from 'src/helper/api-response';
import { DepartmentService } from 'src/services/department.service';

@Controller('department')
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Post('create')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.ADMIN)
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
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.ADMIN)
  async findAll(): Promise<ApiResponse<Department[]>> {
    const data = await this.departmentService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Get departments successfully',
      data,
    };
  }
}
