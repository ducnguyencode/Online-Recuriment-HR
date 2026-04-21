import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmployeeCreateDto } from 'src/dto/employee/employee.create.dto';
import { EmployeeFindDto } from 'src/dto/employee/employee.find.dto';
import { Employee } from 'src/entities/employee.entity';
import { User } from 'src/entities/user.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { EmployeeService } from 'src/services/employee.service';

@Controller('employee')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  async findAll(
    @Query() query: EmployeeFindDto,
  ): Promise<ApiResponse<FindResponseDto<Employee>>> {
    const data = await this.employeeService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load employees',
      data,
    };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() vacancyCreateDto: EmployeeCreateDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.employeeService.create(vacancyCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a vacancy',
      data,
    };
  }
}
