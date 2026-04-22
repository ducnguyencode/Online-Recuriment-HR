import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enum';
import { USER_ROLES } from 'src/auth/role.constants';
import { AdminUserFindDto } from 'src/dto/admin/admin-user-find.dto';
import { CreateStaffAccountDto } from 'src/dto/admin/create-staff-account.dto';
import { Employee } from 'src/entities/employee.entity';
import { User } from 'src/entities/user.entity';
import { Department } from 'src/entities/department.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { Repository } from 'typeorm';
import { BrevoApiService } from './brevo-api.service';
import { UpdateStaffRoleDto } from 'src/dto/admin/update-staff-role.dto';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departments: Repository<Department>,
    private readonly brevoApi: BrevoApiService,
  ) {}

  async findAll(query: AdminUserFindDto): Promise<FindResponseDto<User>> {
    const { page, limit, role, departmentId, isActive, search } = query;
    const qb = this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('user.role IN (:...staffRoles)', {
        staffRoles: [UserRole.HR, UserRole.INTERVIEWER],
      });

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (departmentId) {
      qb.andWhere('employee.departmentId = :departmentId', { departmentId });
    }
    if (typeof isActive === 'boolean') {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }
    if (search?.trim()) {
      qb.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, totalItems] = await qb.getManyAndCount();
    return {
      items,
      totalItems,
      totalPage: Math.max(1, Math.ceil(totalItems / limit)),
    };
  }

  async createStaff(dto: CreateStaffAccountDto): Promise<User> {
    this.assertStaffRole(dto.role);
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const department = await this.departments.findOne({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const exists = await this.users.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const tempPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const userRoleToken =
      dto.role === UserRole.HR ? USER_ROLES.HR : USER_ROLES.INTERVIEWER;

    const saved = await this.users.manager.transaction(async (manager) => {
      const user = manager.create(User, {
        email,
        fullName,
        phone: dto.phone?.trim() || undefined,
        role: dto.role,
        roles: userRoleToken,
        password: passwordHash,
        isVerified: true,
        isActive: true,
        mustChangePassword: true,
        verifiedAt: new Date(),
      });
      const createdUser = await manager.save(User, user);
      const employee = manager.create(Employee, {
        user: createdUser,
        department,
      });
      await manager.save(Employee, employee);
      return createdUser;
    });

    await this.sendWelcomeCredentials(
      saved.email,
      saved.fullName,
      tempPassword,
      dto.role,
    );
    return this.findByIdOrThrow(saved.id);
  }

  async updateRole(userId: number, dto: UpdateStaffRoleDto): Promise<User> {
    this.assertStaffRole(dto.role);
    const user = await this.findByIdOrThrow(userId);
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Superadmin role cannot be changed here');
    }
    user.role = dto.role;
    user.roles =
      dto.role === UserRole.HR ? USER_ROLES.HR : USER_ROLES.INTERVIEWER;
    await this.users.save(user);
    return this.findByIdOrThrow(userId);
  }

  async deactivate(userId: number): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    user.isActive = false;
    await this.users.save(user);
    return user;
  }

  async activate(userId: number): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    user.isActive = true;
    await this.users.save(user);
    return user;
  }

  async resendTemporaryPassword(userId: number): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    this.assertStaffRole(user.role);
    const tempPassword = this.generateTemporaryPassword();
    user.password = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    await this.users.save(user);
    await this.sendWelcomeCredentials(
      user.email,
      user.fullName,
      tempPassword,
      user.role,
    );
  }

  private async findByIdOrThrow(userId: number): Promise<User> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['employee', 'employee.department'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private assertStaffRole(role: UserRole): void {
    if (role !== UserRole.HR && role !== UserRole.INTERVIEWER) {
      throw new BadRequestException('Only HR or Interviewer role is allowed');
    }
  }

  private generateTemporaryPassword(): string {
    const token = Math.random().toString(36).slice(-8);
    return `Tmp@${token}1`;
  }

  private async sendWelcomeCredentials(
    email: string,
    fullName: string,
    tempPassword: string,
    role: UserRole,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h3>Hello ${fullName},</h3>
        <p>Your staff account has been created.</p>
        <p><b>Role:</b> ${role}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Temporary password:</b> ${tempPassword}</p>
        <p>Please change your password immediately after first login.</p>
      </div>
    `;
    await this.brevoApi.sendTransactionalEmail({
      toEmail: email,
      toName: fullName,
      subject: 'Your HR Recruitment staff account',
      html,
    });
  }
}
