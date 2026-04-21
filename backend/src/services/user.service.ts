/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { TokenType, UserRole } from 'src/common/enum';
import { Applicant } from 'src/entities/applicant.entity';
import { Employee } from 'src/entities/employee.entity';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { Department } from 'src/entities/department.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userTable: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  findByEmail(email: string) {
    return this.userTable.findOne({ where: { email } });
  }

  async findUserVerifiedByEmail(email: string) {
    const user = await this.userTable.findOne({ where: { email } });
    if (!user)
      throw new UnauthorizedException('Email or password not correct!');

    if (user.isVerified == false)
      throw new UnauthorizedException('Account not verified');

    return user;
  }

  findById(id: number) {
    return this.userTable.findOne({ where: { id } });
  }

  async createRegisterApplicant(data: UserCreateDto) {
    let user: User;
    await this.userTable.manager.transaction(async (manager) => {
      const existing = await manager.findOne(User, {
        where: { email: data.email },
      });
      if (!existing) {
        user = manager.create(User, {
          ...data,
          role: UserRole.APPLICANT,
          password: bcrypt.hashSync(data.password, 10),
        });
      } else {
        if (existing.isVerified) {
          throw new ConflictException('Account already exist');
        }

        if (existing.verificationToken) {
          const { expired } = this.getTokenInfo(existing.verificationToken);

          if (!expired) {
            throw new ConflictException(
              'Account already register! Check email to verify.',
            );
          }
        }

        existing.role = UserRole.APPLICANT;
        existing.password = bcrypt.hashSync(data.password, 10);
        user = existing;
      }

      const token = this.generateEmailToken(
        user,
        null,
        UserRole.APPLICANT,
        '1m',
        TokenType.EMAIL_REGISTER_VERIFY,
      );
      user.verificationToken = token;
      user = await manager.save(user);
    });

    if (!user!.isVerified) {
      this.sendVerification(user!).catch((err) => {
        console.error('Send verification failed', err);
      });
    }

    return user!;
  }

  async verifyAccount(payload: {
    email: string;
    departmentId: number;
    role: UserRole;
    type: TokenType;
  }) {
    return this.userTable.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { email: payload.email },
      });

      if (!user) {
        throw new NotFoundException('Account not found!');
      }
      if (user.isVerified == true) {
        if (payload.type == TokenType.EMAIL_REGISTER_VERIFY) {
          throw new ServiceUnavailableException('Account is already verified!');
        }
        if (
          payload.type == TokenType.EMAIL_INVITE_VERIFY &&
          user.role == payload.role
        ) {
          throw new ServiceUnavailableException(
            'Employee account is already verified!',
          );
        }
      }

      user.role = payload.role;
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationToken = null;

      if (user.role == UserRole.APPLICANT) {
        let applicant = await manager.findOne(Applicant, { where: { user } });
        if (!applicant) {
          applicant = manager.create(Applicant, { user: user });
        }

        applicant = await manager.save(applicant);
        user.applicant = applicant;
      } else {
        let employee = await manager.findOne(Employee, { where: { user } });
        if (!employee) {
          employee = manager.create(Employee, { user: user });
        }
        employee.isActive = true;
        employee.department = { id: payload.departmentId } as Department;
        employee = await manager.save(employee);
        user.employee = employee;
      }

      return await manager.save(user);
    });
  }

  async sendVerification(user: User, rawPassword?: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    const verifyUrl = `${frontendUrl}/verify-email?token=${user.verificationToken}`;

    await this.mailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verifyUrl,
      rawPassword,
    );
  }

  generateEmailToken(
    user: { id: number; email: string; role: UserRole },
    departmentId: number | null,
    role: UserRole = UserRole.APPLICANT,
    expiresIn: number | StringValue = '15m',
    type: TokenType,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      departmentId,
      role: role,
      type: type,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_EMAIL_SECRET'),
      expiresIn: expiresIn,
    });
  }

  getTokenInfo(token: string) {
    const decoded = this.jwtService.decode(token);

    if (!decoded || !decoded.exp) {
      throw new BadRequestException('Invalid token');
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    const type = decoded.type as TokenType;

    return {
      expired: remaining <= 0,
      remaining: Math.max(0, remaining),
      type,
    };
  }
}
