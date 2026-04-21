import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { EmployeeFindDto } from 'src/dto/employee/employee.find.dto';
import { Employee } from 'src/entities/employee.entity';
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
      message: 'Success create a applicant',
      data,
    };
  }
}
