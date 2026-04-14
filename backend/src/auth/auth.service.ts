import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Request } from 'express';
import { UserRole } from 'src/enum/user-role.enum';
import { Applicant } from 'src/entities/applicant.entity';
import { Employee } from 'src/entities/employee.entity';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { LoginHistory } from 'src/entities/login-history.entity';
import { UserAccount } from 'src/entities/user-account.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly jwtService: JwtService,
  ) {}

  async registerEmployee(payload: RegisterEmployeeDto) {
    const existing = await this.userAccountRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const employee = await this.employeeRepository.save(
      this.employeeRepository.create({
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone ?? null,
        jobTitle: payload.jobTitle ?? null,
        departmentId: payload.departmentId ?? null,
      }),
    );

    const account = await this.userAccountRepository.save(
      this.userAccountRepository.create({
        email: payload.email,
        passwordHash: await hash(payload.password, 10),
        employeeId: employee.id,
        applicantId: null,
        role: payload.role ?? UserRole.HR,
      }),
    );

    await this.writeActivity(account.id, 'REGISTER_EMPLOYEE', {
      employeeId: employee.id,
      role: account.role,
    });

    return this.buildAuthResponse(account);
  }

  async registerApplicant(payload: RegisterApplicantDto) {
    const existing = await this.userAccountRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const applicant = await this.applicantRepository.save(
      this.applicantRepository.create({
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone ?? '',
      }),
    );

    const account = await this.userAccountRepository.save(
      this.userAccountRepository.create({
        email: payload.email,
        passwordHash: await hash(payload.password, 10),
        employeeId: null,
        applicantId: applicant.id,
        role: UserRole.APPLICANT,
      }),
    );

    await this.writeActivity(account.id, 'REGISTER_APPLICANT', {
      applicantId: applicant.id,
    });

    return this.buildAuthResponse(account);
  }

  async login(payload: LoginDto, request: Request) {
    const account = await this.userAccountRepository.findOne({
      where: { email: payload.email },
    });

    if (!account || !(await compare(payload.password, account.passwordHash))) {
      if (account) {
        await this.writeLoginHistory(account.id, false, request, 'Invalid password');
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.writeLoginHistory(account.id, true, request, null);
    await this.writeActivity(account.id, 'LOGIN', null);

    return this.buildAuthResponse(account);
  }

  getProfile(user: AuthUser): AuthUser {
    return user;
  }

  private async buildAuthResponse(account: UserAccount) {
    const tokenPayload = {
      sub: account.id,
      email: account.email,
      role: account.role,
      employeeId: account.employeeId,
      applicantId: account.applicantId,
    };

    return {
      accessToken: await this.jwtService.signAsync(tokenPayload),
      user: tokenPayload,
    };
  }

  private async writeLoginHistory(
    userAccountId: string,
    isSuccess: boolean,
    request: Request,
    failureReason: string | null,
  ) {
    await this.loginHistoryRepository.save(
      this.loginHistoryRepository.create({
        userAccountId,
        isSuccess,
        ipAddress: request.ip,
        userAgent: request.get('user-agent') ?? null,
        failureReason,
      }),
    );
  }

  private async writeActivity(
    userAccountId: string,
    action: string,
    metadata: Record<string, unknown> | null,
  ) {
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userAccountId,
        action,
        metadata,
      }),
    );
  }
}
