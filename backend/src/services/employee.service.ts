import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenType, UserRole } from 'src/common/enum';
import { EmployeeCreateDto } from 'src/dto/employee/employee.create.dto';
import { EmployeeFindDto } from 'src/dto/employee/employee.find.dto';
import { Employee } from 'src/entities/employee.entity';
import { User } from 'src/entities/user.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { generatePassword } from 'src/helper/function.helper';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private employeeTable: Repository<Employee>,
    private userService: UserService,
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

  async create(data: EmployeeCreateDto) {
    let user: User;
    let mailData: { user: User; rawPassword?: string };
    const password = generatePassword();
    await this.employeeTable.manager
      .transaction(async (manager) => {
        const existing = await manager.findOne(User, {
          where: { email: data.email },
        });
        if (!existing) {
          user = manager.create(User, {
            email: data.email,
            password: bcrypt.hashSync(password, 10),
            fullName: data.fullName,
            phone: data.phone,
          });
          mailData = { user, rawPassword: password };
        } else {
          if (existing.isVerified) {
            if (existing.role != UserRole.APPLICANT) {
              throw new ConflictException('Employee already exist');
            } else {
              user = existing;
              mailData = { user };
            }
          } else {
            if (existing.verificationToken) {
              const { expired, type } = this.userService.getTokenInfo(
                existing.verificationToken,
              );
              if (type == TokenType.EMAIL_INVITE_VERIFY) {
                if (!expired) {
                  throw new ConflictException(
                    'Employee already invited! But not verify yet',
                  );
                }
              } else {
                user = { ...existing, password: password };
                mailData = { user, rawPassword: password };
              }
            }
          }
        }
        const token = this.userService.generateEmailToken(
          user,
          data.departmentId,
          data.role,
          '1m',
          TokenType.EMAIL_INVITE_VERIFY,
        );
        user.verificationToken = token;

        await manager.save(user);
      })
      .then(() => {
        this.userService
          .sendVerification(mailData.user, mailData.rawPassword)
          .catch((err) => {
            console.error('Send verification failed', err);
          });
      });

    return user!;
  }
}
