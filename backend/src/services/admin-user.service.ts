import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { TokenType, UserRole, VacancyStatus } from 'src/common/enum';
import { AdminUserFindDto } from 'src/dto/admin/admin-user-find.dto';
import { CreateStaffAccountDto } from 'src/dto/admin/create-staff-account.dto';
import { UpdateStaffRoleDto } from 'src/dto/admin/update-staff-role.dto';
import { UpdateStaffAccountDto } from 'src/dto/admin/update-staff-account.dto';
import { Department } from 'src/entities/department.entity';
import { Employee } from 'src/entities/employee.entity';
import { Interview } from 'src/entities/interview.entity';
import { InterviewerPanel } from 'src/entities/interviewer-panel.entity';
import { User } from 'src/entities/user.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { UserService } from 'src/services/user.service';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departments: Repository<Department>,
    @InjectRepository(Vacancy)
    private readonly vacancies: Repository<Vacancy>,
    @InjectRepository(InterviewerPanel)
    private readonly panels: Repository<InterviewerPanel>,
    @InjectRepository(Interview)
    private readonly interviews: Repository<Interview>,
    private readonly userService: UserService,
    private readonly auditLogs: AuditLogService,
  ) {}

  async findAll(
    actor: SafeUserDto,
    query: AdminUserFindDto,
  ): Promise<FindResponseDto<User>> {
    const { page, limit, role, departmentId, isActive, search } = query;
    const qb = this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('user.role IN (:...staffRoles)', {
        staffRoles: [UserRole.HR, UserRole.INTERVIEWER],
      });

    this.assertActorCanManageRole(actor, role);
    if (actor.role === UserRole.HR) {
      qb.andWhere('user.role = :onlyInterviewer', {
        onlyInterviewer: UserRole.INTERVIEWER,
      });
    }

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

  async createStaff(actor: SafeUserDto, dto: CreateStaffAccountDto): Promise<User> {
    this.assertStaffRole(dto.role);
    this.assertActorCanManageRole(actor, dto.role);
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

    const tempUser: Pick<User, 'id' | 'email' | 'role'> = {
      id: 0,
      email,
      role: dto.role,
    };
    const verifyToken = this.userService.generateEmailToken(
      tempUser,
      dto.departmentId,
      dto.role,
      '24h',
      TokenType.EMAIL_INVITE_VERIFY,
    );

    const saved = await this.users.manager.transaction(async (manager) => {
      const user = manager.create(User, {
        email,
        fullName,
        phone: dto.phone?.trim() || undefined,
        role: dto.role,
        roles: dto.role === UserRole.HR ? UserRole.HR : UserRole.INTERVIEWER,
        // placeholder hash, real password is set by set-initial-password flow
        password:
          '$2b$10$FfLdr1b6vkbWgJmnM9yY2u7EZw8iN88Q/xnE64DZPV4f7n6i5Ql6W',
        isVerified: false,
        isActive: true,
        mustChangePassword: true,
        verificationToken: verifyToken,
      });
      const createdUser = await manager.save(User, user);
      const employee = manager.create(Employee, {
        user: createdUser,
        department,
        jobTitle: dto.position?.trim() || undefined,
        isActive: true,
      });
      await manager.save(Employee, employee);
      return createdUser;
    });

    await this.userService.sendVerification(saved);
    return this.findByIdOrThrow(saved.id);
  }

  async updateStaff(
    actor: SafeUserDto,
    userId: number,
    dto: UpdateStaffAccountDto,
  ): Promise<User> {
    this.assertStaffRole(dto.role);
    this.assertActorCanManageRole(actor, dto.role);
    const user = await this.findByIdOrThrow(userId);
    this.assertActorCanManageRole(actor, user.role);
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Superadmin cannot be edited here');
    }

    const department = await this.departments.findOne({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const nextEmail = user.email.trim().toLowerCase();
    const exists = await this.users.findOne({ where: { email: nextEmail } });
    if (exists && exists.id !== user.id) {
      throw new ConflictException('Email already exists');
    }

    user.fullName = dto.fullName.trim();
    user.phone = dto.phone?.trim() || '';
    user.role = dto.role;
    user.roles = dto.role === UserRole.HR ? UserRole.HR : UserRole.INTERVIEWER;
    await this.users.save(user);

    let employee = await this.employees.findOne({
      where: { user: { id: user.id } },
      relations: ['user', 'department'],
    });
    if (!employee) {
      employee = this.employees.create({
        user,
      });
    }
    employee.department = department;
    employee.jobTitle = dto.position?.trim() || '';
    employee.isActive = user.isActive;
    await this.employees.save(employee);

    return this.findByIdOrThrow(userId);
  }

  async getRoleChangePreconditions(userId: number, newRole: UserRole) {
    this.assertStaffRole(newRole);
    const user = await this.findByIdOrThrow(userId);
    const blockingVacancies: number[] = [];
    const blockingInterviews: string[] = [];

    if (user.role === UserRole.HR && newRole === UserRole.INTERVIEWER) {
      const rows = await this.vacancies.find({
        where: { createdById: user.id, status: VacancyStatus.OPENED },
        select: ['id'],
      });
      blockingVacancies.push(...rows.map((v) => v.id));
    }

    if (user.role === UserRole.INTERVIEWER && newRole === UserRole.HR) {
      const employee = await this.employees.findOne({
        where: { user: { id: user.id } },
        relations: ['user'],
      });
      if (employee) {
        const panelRows = await this.panels
          .createQueryBuilder('p')
          .innerJoin(Interview, 'i', 'i.id = p.interviewId')
          .where('p.employeeId = :employeeId', { employeeId: String(employee.id) })
          .andWhere('i.startTime > :now', { now: new Date() })
          .select(['i.id AS interview_id'])
          .getRawMany<{ interview_id: string }>();
        blockingInterviews.push(...panelRows.map((r) => r.interview_id));
      }
    }

    return {
      blockingVacancies,
      blockingInterviews,
      canProceed: blockingVacancies.length === 0 && blockingInterviews.length === 0,
    };
  }

  async updateRole(
    actorUserId: number,
    userId: number,
    dto: UpdateStaffRoleDto,
    req?: Request,
  ): Promise<User> {
    this.assertStaffRole(dto.role);
    const actor = await this.findByIdOrThrow(actorUserId);
    const reason = dto.reason.trim();
    if (reason.length < 10) {
      throw new BadRequestException('Reason must be at least 10 characters');
    }

    if (actorUserId === userId) {
      throw new ForbiddenException('You cannot change your own role');
    }
    let fromRole: UserRole = UserRole.APPLICANT;
    await this.users.manager.transaction(async (manager) => {
      const user = await manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('user.employee', 'employee')
        .leftJoinAndSelect('employee.department', 'department')
        .where('user.id = :id', { id: userId })
        .getOne();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Superadmin role cannot be changed here');
      }

      const preconditions = await this.getRoleChangePreconditions(userId, dto.role);
      if (!preconditions.canProceed) {
        throw new BadRequestException({
          message: 'Role change preconditions are not satisfied',
          ...preconditions,
        });
      }

      fromRole = user.role;
      user.role = dto.role;
      user.roles = dto.role === UserRole.HR ? UserRole.HR : UserRole.INTERVIEWER;
      await manager.save(User, user);

      await this.auditLogs.createRoleChangedLog({
        actorId: actor.id,
        actorRoleSnapshot: actor.role,
        targetId: user.id,
        fromRole,
        toRole: dto.role,
        reason,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
        manager,
      });
    });

    const updatedUser = await this.findByIdOrThrow(userId);
    const otherSuperAdmins = await this.users.find({
      where: { role: UserRole.SUPER_ADMIN },
      select: ['id', 'email', 'fullName'],
    });
    const notifyList = [updatedUser, ...otherSuperAdmins].filter(
      (candidate, idx, arr) =>
        candidate.id !== actor.id &&
        arr.findIndex((u) => u.id === candidate.id) === idx,
    );
    await Promise.all(
      notifyList.map((receiver) =>
        this.userService.sendRoleChangedNotification({
          email: receiver.email,
          name: receiver.fullName,
          actorName: actor.fullName,
          fromRole,
          toRole: dto.role,
          reason,
        }),
      ),
    );

    return updatedUser;
  }

  async deactivate(actor: SafeUserDto, userId: number): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    this.assertActorCanManageRole(actor, user.role);
    user.isActive = false;
    await this.users.save(user);
    return user;
  }

  async activate(actor: SafeUserDto, userId: number): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    this.assertActorCanManageRole(actor, user.role);
    user.isActive = true;
    await this.users.save(user);
    return user;
  }

  async resendInvite(actor: SafeUserDto, userId: number): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    this.assertStaffRole(user.role);
    this.assertActorCanManageRole(actor, user.role);
    if (user.isVerified) {
      throw new BadRequestException('Account already verified');
    }
    const employee = await this.employees.findOne({
      where: { user: { id: userId } },
      relations: ['department', 'user'],
    });
    if (!employee?.department?.id) {
      throw new BadRequestException('Department is missing for invited account');
    }

    user.verificationToken = this.userService.generateEmailToken(
      { id: user.id, email: user.email, role: user.role },
      employee.department.id,
      user.role,
      '24h',
      TokenType.EMAIL_INVITE_VERIFY,
    );
    await this.users.save(user);
    await this.userService.sendVerification(user);
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

  private assertActorCanManageRole(
    actor: SafeUserDto,
    targetRole?: UserRole | '',
  ): void {
    if (actor.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (actor.role === UserRole.HR) {
      if (!targetRole || targetRole === UserRole.INTERVIEWER) {
        return;
      }
      throw new ForbiddenException(
        'HR can only manage Interviewer staff accounts',
      );
    }
    throw new ForbiddenException(
      'You do not have permission to manage staff accounts',
    );
  }
}
