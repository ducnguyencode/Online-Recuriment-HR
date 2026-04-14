import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from 'src/entities/department.entity';
import { Employee } from 'src/entities/employee.entity';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  createDepartment(payload: CreateDepartmentDto) {
    return this.departmentRepository.save(this.departmentRepository.create(payload));
  }

  getDepartments() {
    return this.departmentRepository.find({
      relations: {
        employees: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  createEmployee(payload: CreateEmployeeDto) {
    return this.employeeRepository.save(
      this.employeeRepository.create({
        ...payload,
        departmentId: payload.departmentId ?? null,
        phone: payload.phone ?? null,
        jobTitle: payload.jobTitle ?? null,
      }),
    );
  }

  getEmployees() {
    return this.employeeRepository.find({
      relations: {
        department: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
