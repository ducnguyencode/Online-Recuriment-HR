import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/common/enum';
import { EmployeeFindDto } from 'src/dto/employee/applicant.find.dto';
import { Employee } from 'src/entities/employee.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private employeeTable: Repository<Employee>,
  ) {}

  async findAll(request: EmployeeFindDto): Promise<FindResponseDto<Employee>> {
    const { page, limit, role, search, departmentId } = request;

    const qb = this.employeeTable
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.user', 'user')
      .andWhere('user.role NOT IN (:...excludedRoles)', {
        excludedRoles: [UserRole.APPLICANT, UserRole.SUPER_ADMIN],
      });

    //Filter
    if (search) {
      qb.andWhere('user.fullName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (departmentId) {
      qb.andWhere('employee.departmentId = :departmentId', {
        departmentId: departmentId,
      });
    }

    if (role) {
      qb.andWhere('user.role = :role', {
        role: role,
      });
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    qb.orderBy('employee.createdAt', 'DESC');

    const [employees, totalEmployee] = await qb.getManyAndCount();

    return {
      items: employees,
      totalItems: totalEmployee,
      totalPage: Math.ceil(totalEmployee / limit),
    };
  }
}
