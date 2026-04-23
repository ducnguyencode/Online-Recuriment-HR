import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/decorator';
import { EmployeeChangePasswordDto } from 'src/dto/employee/employee.change-password.dto';
import { EmployeeCreateDto } from 'src/dto/employee/employee.create.dto';
import { EmployeeFindDto } from 'src/dto/employee/employee.find.dto';
import { EmployeeUpdateDto } from 'src/dto/employee/employee.update.dto';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
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
    @Body() employeeCreateDto: EmployeeCreateDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.employeeService.create(employeeCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a employee',
      data,
    };
  }

  @Put('update-account')
  @UseGuards(JwtAuthGuard)
  async updateAccount(
    @Body() employeeUpdateDto: EmployeeUpdateDto,
    @CurrentUser() user: SafeUserDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.employeeService.updateAccount(
      employeeUpdateDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success update an employee details',
      data,
    };
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() employeeChangePasswordDto: EmployeeChangePasswordDto,
    @CurrentUser() user: SafeUserDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.employeeService.changePassword(
      employeeChangePasswordDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change password of an employee',
      data,
    };
  }
}
