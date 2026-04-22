import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LessThan, QueryFailedError, Repository } from 'typeorm';
import { Applicant } from '../entities/applicant.entity';
import { SignupVerification } from '../entities/signup-verification.entity';
import { User } from '../entities/user.entity';
import { ChangePasswordDto } from '../dto/auth/change-password.dto';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterApplicantDto } from '../dto/auth/register-applicant.dto';
import { RegisterApplicantRequestDto } from '../dto/auth/register-applicant-request.dto';
import { CompleteRegisterDto } from '../dto/auth/complete-register.dto';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto';
import {
  canonicalizeRoles,
  isApplicantRole,
  isStaffRoles,
  USER_ROLES,
} from './role.constants';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BrevoApiService } from '../services/brevo-api.service';
import { UserRole } from 'src/common/enum';
import { userRoleEnumToAuthRoles } from './user-role.mapper';

export type AuthUserView = {
  id: number;
  email: string;
  fullName: string;
  role: 'HR' | 'Interviewer' | 'Applicant' | 'Superadmin';
  applicantId?: string;
  departmentId?: number | null;
  mustChangePassword?: boolean;
  isActive: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Applicant)
    private readonly applicants: Repository<Applicant>,
    @InjectRepository(SignupVerification)
    private readonly signupVerifications: Repository<SignupVerification>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
    private readonly brevoApi: BrevoApiService,
  ) {}

  private publicUrl(pathname: string, query?: Record<string, string>): string {
    const base = this.config.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:4200';
    const url = new URL(base.replace(/\/$/, '') + pathname);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      typeof err.driverError === 'object' &&
      err.driverError !== null &&
      (err.driverError as { code?: string }).code === '23505'
    );
  }

  private storedRoleStrings(user: User): string[] {
    const raw = user.roles?.trim();
    if (raw) {
      return canonicalizeRoles(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    return canonicalizeRoles(userRoleEnumToAuthRoles(user.role));
  }

  private mapRolesToDisplay(roles: string[]): AuthUserView['role'] {
    const r = canonicalizeRoles(roles);
    if (r.includes(USER_ROLES.SUPERADMIN)) return 'Superadmin';
    if (r.includes(USER_ROLES.HR)) return 'HR';
    if (r.includes(USER_ROLES.INTERVIEWER)) return 'Interviewer';
    return 'Applicant';
  }

  toUserView(user: User): AuthUserView {
    const roles = this.storedRoleStrings(user);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: this.mapRolesToDisplay(roles),
      applicantId:
        user.applicant?.id != null ? String(user.applicant.id) : undefined,
      departmentId: user.employee?.department?.id ?? null,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };
  }

  /** Removes expired sign-up verification records after 24 hours. */
  async purgeExpiredSignupVerifications(): Promise<void> {
    try {
      await this.signupVerifications.delete({
        expiresAt: LessThan(new Date()),
      });
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        typeof err.driverError === 'object' &&
        err.driverError &&
        (err.driverError as { code?: string }).code === '42P01'
      ) {
        return;
      }
      throw err;
    }
  }

  /**
   * Step 1 for registration when REQUIRE_EMAIL_VERIFICATION=true:
   * send verification email via Brevo/SMTP.
   */
  async requestRegisterApplicant(dto: RegisterApplicantRequestDto) {
    const requireEmailVerification =
      this.config.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true';
    if (!requireEmailVerification) {
      throw new BadRequestException(
        'REQUIRE_EMAIL_VERIFICATION is currently disabled. To receive a verification email link, set REQUIRE_EMAIL_VERIFICATION=true in .env (and requireEmailVerification: true in Angular). Or use POST /auth/register/applicant for instant account creation (no email).',
      );
    }
    await this.purgeExpiredSignupVerifications();
    const email = dto.email.toLowerCase().trim();
    const taken = await this.users.findOne({ where: { email } });
    if (taken) {
      throw new ConflictException('Email already registered');
    }
    const token = randomBytes(32).toString('hex');
    const pendingPasswordHash = await bcrypt.hash(dto.password, 10);
    await this.signupVerifications.delete({ email }).catch(() => undefined);
    await this.signupVerifications.save(
      this.signupVerifications.create({
        email,
        code: null,
        verifyToken: token,
        pendingFullName: dto.fullName.trim(),
        pendingPasswordHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );
    const link = this.publicUrl('/verify-email', { token });
    try {
      await this.brevoApi.sendTransactionalEmail({
        toEmail: email,
        toName: dto.fullName.trim(),
        subject: 'Verify your account registration',
        html: `<p>Hello ${dto.fullName.trim()},</p><p>Click the link below to complete your registration (valid for 24 hours):</p><p><a href="${link}">${link}</a></p><p>If you did not request this registration, please ignore this email.</p>`,
      });
    } catch (e) {
      console.warn('[auth] verification email failed', e);
      const hint =
        e instanceof Error ? e.message : 'Check Brevo / SMTP settings in .env.';
      throw new BadRequestException(hint);
    }
    return { message: 'A verification link has been sent to your email.' };
  }

  /** Step 2: open email link and submit token to API */
  async completeRegisterApplicant(dto: CompleteRegisterDto) {
    await this.purgeExpiredSignupVerifications();
    const row = await this.signupVerifications.findOne({
      where: { verifyToken: dto.token },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link.');
    }
    if (!row.pendingPasswordHash || !row.pendingFullName) {
      throw new BadRequestException('Incomplete registration payload.');
    }
    const email = row.email.toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      await this.signupVerifications.delete({ email: row.email });
      throw new ConflictException('Email already registered');
    }
    const userEntity = this.users.create({
      fullName: row.pendingFullName,
      email,
      password: row.pendingPasswordHash,
      role: UserRole.APPLICANT,
      roles: USER_ROLES.APPLICANT,
      isVerified: true,
      mustChangePassword: false,
      isActive: true,
    });
    const savedUser = await this.users.save(userEntity);
    const applicant = this.applicants.create({
      user: savedUser,
      fullName: row.pendingFullName,
      email,
    });
    await this.applicants.save(applicant);
    await this.signupVerifications.delete({ email: row.email });
    const fullUser = await this.users.findOne({
      where: { id: savedUser.id },
      relations: ['applicant', 'employee', 'employee.department'],
    });
    const token = await this.signToken(fullUser!);
    return { token, user: this.toUserView(fullUser!) };
  }

  async registerApplicant(dto: RegisterApplicantDto) {
    const email = dto.email.toLowerCase().trim();
    const requireEmailVerification =
      this.config.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true';
    if (requireEmailVerification) {
      throw new BadRequestException(
        'Email verification is enabled. Use POST /auth/register/applicant/request and open the link from email.',
      );
    }

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const userEntity = this.users.create({
      fullName: dto.fullName,
      email,
      password: hashed,
      role: UserRole.APPLICANT,
      roles: USER_ROLES.APPLICANT,
      isVerified: true,
      mustChangePassword: false,
      isActive: true,
    });
    const savedUser = await this.users.save(userEntity);
    const applicant = this.applicants.create({
      user: savedUser,
      fullName: dto.fullName,
      email,
    });
    try {
      await this.applicants.save(applicant);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        await this.users.delete({ id: savedUser.id }).catch(() => undefined);
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
    await this.signupVerifications.delete({ email }).catch(() => undefined);
    const fullUser = await this.users.findOne({
      where: { id: savedUser.id },
      relations: ['applicant', 'employee', 'employee.department'],
    });
    const token = await this.signToken(fullUser!);
    return { token, user: this.toUserView(fullUser!) };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const portal = dto.portal ?? 'applicant';
    const roles = this.storedRoleStrings(user);
    if (portal === 'unified') {
      // allow any role
    } else if (portal === 'staff' && !isStaffRoles(roles)) {
      throw new UnauthorizedException('Use applicant sign-in for this account');
    }
    const token = await this.signToken(user);
    this.events.emit('auth.login', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      portal,
    });
    return { token, user: this.toUserView(user) };
  }

  private async signToken(user: User) {
    return this.jwt.signAsync({
      sub: user.id,
      roles: this.storedRoleStrings(user),
    });
  }

  async me(userId: number) {
    const user = await this.users.findOne({
      where: { id: userId, isActive: true },
      relations: ['applicant', 'employee', 'employee.department'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toUserView(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    await this.users.save(user);
    return { message: 'Password updated' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    const generic = {
      message:
        'If the email exists in the system, reset instructions have been sent.',
    };
    if (!user) {
      return generic;
    }
    const token = randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.users.save(user);
    const link = this.publicUrl('/login', { resetToken: token });
    try {
      await this.brevoApi.sendTransactionalEmail({
        toEmail: user.email,
        toName: user.fullName,
        subject: 'Reset your password',
        html: `<p>Hello ${user.fullName},</p><p>Click the link below to reset your password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you did not request this, please ignore this email.</p>`,
      });
    } catch (e) {
      user.resetPasswordToken = null;
      user.resetPasswordTokenExpiresAt = null;
      await this.users.save(user);
      console.warn('[auth] forgot-password email failed', e);
      const msg = e instanceof Error ? e.message : 'Unable to send email.';
      throw new BadRequestException(
        `Failed to send password reset email: ${msg}. Check BREVO_* / SMTP settings in .env and APP_PUBLIC_URL.`,
      );
    }
    return generic;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.users.findOne({
      where: { resetPasswordToken: dto.token },
    });
    if (
      !user ||
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    user.mustChangePassword = false;
    await this.users.save(user);
    return { message: 'Password has been reset. You can sign in now.' };
  }
}
