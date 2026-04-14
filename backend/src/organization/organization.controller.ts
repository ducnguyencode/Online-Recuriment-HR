import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/enum/user-role.enum';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { OrganizationService } from './organization.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HR)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('departments')
  createDepartment(@Body() payload: CreateDepartmentDto) {
    return this.organizationService.createDepartment(payload);
  }

  @Get('departments')
  getDepartments() {
    return this.organizationService.getDepartments();
  }

  @Post('employees')
  createEmployee(@Body() payload: CreateEmployeeDto) {
    return this.organizationService.createEmployee(payload);
  }

  @Get('employees')
  getEmployees() {
    return this.organizationService.getEmployees();
  }
}
