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
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(userCreateDto: UserCreateDto) {
    return await this.userService.createRegisterApplicant(userCreateDto);
  }

  async login(email: string, password: string) {
    const user = await this.userService.findUserVerifiedByEmail(email);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Email or password not correct!');

    return signToken(user, this.jwtService);
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

    return this.userService.verifyAccount(payload);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userService.findByEmail(email);

    // Keep response generic to avoid leaking account existence.
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
    const resetUrl = `${frontendUrl}/forgot-password?token=${resetToken}`;
    await this.userService.sendPasswordReset(user.email, user.fullName, resetUrl);

    return { message: 'If your account exists, a reset link has been sent.' };
  }

  async resendVerify(dto: ResendVerifyDto) {
    await this.userService.resendApplicantVerification(dto.email);
    return { message: 'If your account exists, a verification link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
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
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    await this.userService.save(user);

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

  async changePassword(userId: number, dto: ChangePasswordDto) {
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

    return { message: 'Password changed successfully.' };
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
