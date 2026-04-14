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
import { DepartmentService } from 'src/services/department.service';

@Controller('department')
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Post('create')
  async create(@Body() deparmentCreateDto: DepartmentCreateDto) {
    try {
      return await this.departmentService.create(deparmentCreateDto);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.departmentService.findAll();
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }
}
