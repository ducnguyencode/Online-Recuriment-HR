/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { DepartmentCreateDto } from 'src/dto/department.create.dto';
import { Department } from 'src/entities/department.entity';
import { ApiResponse } from 'src/helper/api-response';
import { DepartmentService } from 'src/services/department.service';

@Controller('department')
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Post('create')
  async create(
    @Body() deparmentCreateDto: DepartmentCreateDto,
  ): Promise<ApiResponse<Department>> {
    try {
      const data = await this.departmentService.create(deparmentCreateDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Success create a department',
        data,
      };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: err as string,
          data: null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(): Promise<ApiResponse<Department[]>> {
    try {
      const data = await this.departmentService.findAll();
      return {
        statusCode: HttpStatus.OK,
        message: 'Get departments successfully',
        data,
      };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: err as string,
          data: null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
