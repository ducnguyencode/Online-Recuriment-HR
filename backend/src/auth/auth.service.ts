import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Request } from 'express';
import * as nodemailer from 'nodemailer';
import { Applicant } from 'src/entities/applicant.entity';
import { LoginHistory } from 'src/entities/login-history.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { ForgotPasswordDto } from 'src/dto/forgot-password.dto';
import { LoginDto } from 'src/dto/login.dto';
import { RegisterApplicantDto } from 'src/dto/register-applicant.dto';
import { RegisterEmployeeDto } from 'src/dto/register-employee.dto';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { AuthUser } from './auth-user.interface';

@Injectable()
export class AuthService {
  private loginHistoryColumnMode: 'userId' | 'userAccountId' | 'none' | null = null;
  private loginHistorySchemaChecked = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerEmployee(payload: RegisterEmployeeDto) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        fullName: payload.fullName,
        email: normalizedEmail,
        passwordHash: await hash(payload.password, 10),
        roles: [payload.role ?? 'HR'],
        departmentId: payload.departmentId ?? null,
        mustChangePassword: true,
      }),
    );

    return this.buildAuthResponse(user, 'Register employee successfully');
  }

  async registerApplicant(payload: RegisterApplicantDto) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    await this.createApplicantSafely(payload.fullName, normalizedEmail, payload.phone ?? '');

    const user = await this.userRepository.save(
      this.userRepository.create({
        fullName: payload.fullName,
        email: normalizedEmail,
        passwordHash: await hash(payload.password, 10),
        roles: ['APPLICANT'],
        mustChangePassword: false,
      }),
    );

    return this.buildAuthResponse(user, 'Register applicant successfully');
  }

  async login(payload: LoginDto, request: Request) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const user = await this.findUserByEmail(normalizedEmail);

    if (!user || !(await this.verifyPassword(payload.password, user.passwordHash))) {
      if (user) {
        await this.writeLoginHistory(user.id, false, request, 'Invalid credentials');
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.writeLoginHistory(user.id, true, request, null);
    return this.buildAuthResponse(user, `Login successfully from ${request.ip}`);
  }

  getProfile(user: AuthUser): AuthUser {
    return user;
  }

  async changePassword(
    user: AuthUser,
    payload: { currentPassword: string; newPassword: string },
  ) {
    if (!payload.currentPassword || !payload.newPassword || payload.newPassword.length < 6) {
      throw new BadRequestException('Invalid password payload');
    }

    const account = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    const isCurrentValid = await compare(payload.currentPassword, account.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    account.passwordHash = await hash(payload.newPassword, 10);
    account.mustChangePassword = false;
    await this.userRepository.save(account);

    return {
      statusCode: 200,
      message: 'Password updated successfully',
    };
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const user = await this.findUserByEmail(normalizedEmail);

    // Always return success message to avoid account enumeration.
    if (!user) {
      return {
        statusCode: 200,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'please-change-this-secret'),
        expiresIn: this.configService.get<string>('RESET_PASSWORD_EXPIRES_IN', '15m') as never,
      },
    );

    const frontendResetUrl = this.configService.get<string>(
      'FRONTEND_RESET_PASSWORD_URL',
      'http://localhost:4200/reset-password',
    );
    const resetLink = `${frontendResetUrl}?token=${encodeURIComponent(token)}`;

    await this.sendBrevoResetPasswordEmail(user.email, user.fullName, resetLink);

    return {
      statusCode: 200,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    let decoded: { sub: number; email: string; type?: string };

    try {
      decoded = await this.jwtService.verifyAsync(payload.token, {
        secret: this.configService.get<string>('JWT_SECRET', 'please-change-this-secret'),
      });
    } catch {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    if (decoded.type !== 'password-reset') {
      throw new BadRequestException('Invalid reset token type');
    }

    const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
    if (!user || this.normalizeEmail(user.email) !== this.normalizeEmail(decoded.email)) {
      throw new BadRequestException('Reset token is invalid');
    }

    user.passwordHash = await hash(payload.newPassword, 10);
    user.mustChangePassword = false;
    await this.userRepository.save(user);

    return {
      statusCode: 200,
      message: 'Password has been reset successfully',
    };
  }

  private async buildAuthResponse(user: User, message: string) {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
    };

    return {
      accessToken: await this.jwtService.signAsync(tokenPayload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        departmentId: user.departmentId,
        mustChangePassword: user.mustChangePassword,
      },
      message,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findUserByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(TRIM(u.email)) = :email', { email })
      .getOne();
  }

  private async verifyPassword(rawPassword: string, passwordHash: string): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    const normalizedHash = passwordHash.startsWith('$2y$')
      ? `$2b$${passwordHash.slice(4)}`
      : passwordHash;

    try {
      return await compare(rawPassword, normalizedHash);
    } catch {
      // Legacy fallback for old seeded/plain passwords.
      return rawPassword === passwordHash;
    }
  }

  private async createApplicantSafely(fullName: string, email: string, phone: string) {
    try {
      await this.applicantRepository.save(
        this.applicantRepository.create({
          fullName,
          email,
          phone,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isLegacyCodeColumnError =
        message.includes('column "code"') && message.includes('applicants');

      if (!isLegacyCodeColumnError) {
        throw error;
      }

      // Fallback for legacy applicants table missing "code" column.
      await this.applicantRepository.query(
        `
          INSERT INTO "applicants" ("fullName", "email", "phone")
          VALUES ($1, $2, $3)
        `,
        [fullName, email, phone],
      );
    }
  }

  private async sendBrevoResetPasswordEmail(email: string, fullName: string, resetLink: string) {
    const host = this.configService.get<string>('BREVO_SMTP_HOST', 'smtp-relay.brevo.com');
    const port = Number(this.configService.get<string>('BREVO_SMTP_PORT', '587'));
    const user = this.configService.get<string>('BREVO_SMTP_USER', '');
    const pass = this.configService.get<string>('BREVO_SMTP_PASS', '');
    const fromEmail = this.configService.get<string>('BREVO_FROM_EMAIL', user);

    if (!user || !pass) {
      throw new BadRequestException('Brevo SMTP is not configured');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Online Recruitment" <${fromEmail}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2>Hello ${fullName || 'there'},</h2>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, copy this URL into your browser:</p>
          <p>${resetLink}</p>
          <p>This link expires soon for security reasons.</p>
        </div>
      `,
    });
  }

  private async writeLoginHistory(
    userId: number,
    isSuccess: boolean,
    request: Request,
    failureReason: string | null,
  ) {
    try {
      if (!this.loginHistorySchemaChecked) {
        await this.ensureLoginHistoryCompatibleSchema();
        this.loginHistorySchemaChecked = true;
        this.loginHistoryColumnMode = null;
      }

      if (this.loginHistoryColumnMode === null) {
        const columns = await this.loginHistoryRepository.query(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'login_history'
          `,
        );
        const names = new Set((columns as Array<{ column_name: string }>).map((c) => c.column_name));
        if (names.has('userId')) {
          this.loginHistoryColumnMode = 'userId';
        } else if (names.has('userAccountId')) {
          this.loginHistoryColumnMode = 'userAccountId';
        } else {
          this.loginHistoryColumnMode = 'none';
        }
      }

      if (this.loginHistoryColumnMode === 'userId') {
        await this.loginHistoryRepository.query(
          `
            INSERT INTO "login_history" ("userId", "ipAddress", "userAgent", "isSuccess", "failureReason")
            VALUES ($1, $2, $3, $4, $5)
          `,
          [userId, request.ip ?? null, request.get('user-agent') ?? null, isSuccess, failureReason],
        );
        return;
      }

      if (this.loginHistoryColumnMode === 'userAccountId') {
        // Legacy schema: userAccountId is uuid. Current auth user id is integer.
        // Skip writing to avoid login failure on incompatible schema.
        return;
      }
    } catch {
      // Never break login flow because of audit logging failure.
      return;
    }
  }

  private async ensureLoginHistoryCompatibleSchema() {
    try {
      await this.loginHistoryRepository.query(
        `
          ALTER TABLE "login_history"
          ADD COLUMN IF NOT EXISTS "userId" INT
        `,
      );
      await this.loginHistoryRepository.query(
        `
          ALTER TABLE "login_history"
          ALTER COLUMN "userAccountId" DROP NOT NULL
        `,
      );
    } catch {
      // If schema cannot be changed, continue with fallback detection logic.
    }
  }
}
