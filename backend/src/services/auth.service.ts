/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from 'src/common/enum';
import { ChangePasswordDto } from 'src/dto/auth/change-password.dto';
import { ForgotPasswordDto } from 'src/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/dto/auth/reset-password.dto';
import { SetInitialPasswordDto } from 'src/dto/auth/set-initial-password.dto';
import { ResendVerifyDto } from 'src/dto/auth/resend-verify.dto';
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { TokenExpiredError } from 'jsonwebtoken';
import { signToken } from 'src/helper/function.helper';
import { AuditLogService } from './audit-log.service';
import { LoginHistoryService } from './login-history.service';

export interface AuthRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginHistoryService: LoginHistoryService,
    private auditLogService: AuditLogService,
  ) {}

  async register(userCreateDto: UserCreateDto) {
    return await this.userService.createRegisterApplicant(userCreateDto);
  }

  async login(email: string, password: string, context?: AuthRequestContext) {
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Step 1: Find user (without verification check first — we need to check lock status)
      const user = await this.userService.findByEmail(normalizedEmail);
      if (!user) {
        throw new UnauthorizedException('Email or password not correct!');
      }

      // Step 2: Brute force — check if account is temporarily locked
      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil(
          (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
        );
        throw new UnauthorizedException(
          `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
        );
      }

      // Step 3: Email verification check
      if (!user.isVerified) {
        throw new UnauthorizedException('Please verify your email first');
      }

      // Step 4: Active check (deactivated / banned)
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Step 5: Password check
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        }
        await this.userService.save(user);

        throw new UnauthorizedException('Email or password not correct!');
      }

      // Step 6: Success — reset brute force counters
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userService.save(user);
      }

      try {
        await this.loginHistoryService.record({
          email: normalizedEmail,
          userId: user.id,
          status: 'SUCCESS',
          context,
        });

        await this.auditLogService.createLog({
          actorId: user.id,
          actorRoleSnapshot: user.role,
          actorFullName: user.fullName,
          action: 'AUTH_LOGIN_SUCCESS',
          targetId: user.id,
          targetRoleSnapshot: user.role,
          context,
        });
      } catch (logError) {
        console.error('Failed to write auth logs', logError);
      }

      return signToken(user, this.jwtService);
    } catch (error) {
      const existingUser = await this.userService.findByEmail(normalizedEmail);
      try {
        await this.loginHistoryService.record({
          email: normalizedEmail,
          userId: existingUser?.id ?? null,
          status: 'FAILED',
          failureReason:
            error instanceof Error ? error.message : 'Authentication failed',
          context,
        });
      } catch (logError) {
        console.error('Failed to write login history', logError);
      }
      throw error;
    }
  }

  async verifyEmailToken(token: string) {
    if (!token?.trim()) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = this.verifyEmailJwtToken(token);
    const allowedVerifyTypes = [
      TokenType.EMAIL_REGISTER_VERIFY,
      TokenType.EMAIL_INVITE_VERIFY,
    ];
    if (!allowedVerifyTypes.includes(payload.type as TokenType)) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userService.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Account not found!');
    }

    if (!user.verificationToken || user.verificationToken !== token) {
      throw new UnauthorizedException(
        'Verification link is invalid or has already been used.',
      );
    }

    return this.userService.verifyAccount(payload);
  }

  async forgotPassword(dto: ForgotPasswordDto, context?: AuthRequestContext) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return { message: 'If your account exists, a reset link has been sent.' };
    }
    if (!user.isActive) {
      throw new BadRequestException(
        'This account is deactivated and cannot receive password reset email.',
      );
    }

    const resetToken = this.userService.generateEmailToken(
      { id: user.id, email: user.email, role: user.role },
      user.employeeId ?? null,
      user.role,
      '1h',
      TokenType.EMAIL_FORGOT_VERIFY,
    );
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userService.save(user);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    const scopeQuery = dto.scope?.trim()
      ? `&scope=${encodeURIComponent(dto.scope.trim())}`
      : '';
    const resetUrl = `${frontendUrl}/forgot-password?token=${resetToken}${scopeQuery}`;
    await this.userService.sendPasswordReset(
      user.email,
      user.fullName,
      resetUrl,
    );

    try {
      await this.auditLogService.createLog({
        actorId: user.id,
        actorRoleSnapshot: user.role,
        actorFullName: user.fullName,
        action: 'AUTH_FORGOT_PASSWORD_REQUESTED',
        targetId: user.id,
        targetRoleSnapshot: user.role,
        payload: { scope: dto.scope ?? null },
        context,
      });
    } catch (logError) {
      console.error('Failed to write audit log', logError);
    }

    return { message: 'If your account exists, a reset link has been sent.' };
  }

  async resendVerify(dto: ResendVerifyDto) {
    await this.userService.resendApplicantVerification(dto.email);
    return {
      message: 'If your account exists, a verification link has been sent.',
    };
  }

  async verifyResetToken(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Invalid reset token.');
    }

    const user = await this.userService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid reset token.');
    }
    if (
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token has expired.');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_EMAIL_SECRET'),
      });
      if (payload.type !== TokenType.EMAIL_FORGOT_VERIFY) {
        throw new BadRequestException('Invalid token type.');
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Reset token has expired.');
      }
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid reset token.');
    }

    return { valid: true, message: 'Token is valid.' };
  }

  async resetPassword(dto: ResetPasswordDto, context?: AuthRequestContext) {
    const user = await this.userService.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid reset token.');
    }
    if (
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token has expired.');
    }

    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.configService.getOrThrow<string>('JWT_EMAIL_SECRET'),
      });
      if (payload.type !== TokenType.EMAIL_FORGOT_VERIFY) {
        throw new BadRequestException('Invalid token type.');
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Reset token has expired.');
      }
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid reset token.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    if (!user.isVerified) {
      user.isVerified = true;
      user.verifiedAt = new Date();
    }
    if (!user.isActive) {
      user.isActive = true;
    }
    user.verificationToken = null;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    await this.userService.save(user);

    try {
      await this.auditLogService.createLog({
        actorId: user.id,
        actorRoleSnapshot: user.role,
        actorFullName: user.fullName,
        action: 'AUTH_PASSWORD_RESET_SUCCESS',
        targetId: user.id,
        targetRoleSnapshot: user.role,
        context,
      });
    } catch (logError) {
      console.error('Failed to write audit log', logError);
    }

    return { message: 'Password has been reset successfully.' };
  }

  async setInitialPassword(dto: SetInitialPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: this.configService.getOrThrow<string>('JWT_EMAIL_SECRET'),
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.type !== TokenType.EMAIL_INVITE_VERIFY) {
      throw new BadRequestException('Invalid token type');
    }

    const user = await this.userService.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Please verify your email first');
    }
    if (!user.mustChangePassword) {
      throw new BadRequestException('Initial password is already set');
    }

    user.password = await bcrypt.hash(dto.password, 10);
    user.mustChangePassword = false;
    await this.userService.save(user);

    return { message: 'Initial password has been set successfully.' };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
    context?: AuthRequestContext,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    await this.userService.save(user);

    try {
      await this.auditLogService.createLog({
        actorId: user.id,
        actorRoleSnapshot: user.role,
        actorFullName: user.fullName,
        action: 'AUTH_PASSWORD_CHANGED',
        targetId: user.id,
        targetRoleSnapshot: user.role,
        context,
      });
    } catch (logError) {
      console.error('Failed to write audit log', logError);
    }

    return { message: 'Password changed successfully.' };
  }

  async logout(userId: number, context?: AuthRequestContext) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    try {
      await this.auditLogService.createLog({
        actorId: user.id,
        actorRoleSnapshot: user.role,
        actorFullName: user.fullName,
        action: 'AUTH_LOGOUT',
        targetId: user.id,
        targetRoleSnapshot: user.role,
        context,
      });
    } catch (logError) {
      console.error('Failed to write logout audit log', logError);
    }

    return { message: 'Logout success.' };
  }

  private verifyEmailJwtToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_EMAIL_SECRET'),
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
