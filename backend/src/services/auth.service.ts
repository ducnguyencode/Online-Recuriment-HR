/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/entities/user.entity';
import { TokenType, UserRole } from 'src/common/enum';
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { TokenExpiredError } from 'jsonwebtoken';
import { signToken } from 'src/helper/function.helper';
import { ForgotPasswordDto } from 'src/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/dto/auth/reset-password.dto';
import { SetInitialPasswordDto } from 'src/dto/auth/set-initial-password.dto';
import { ChangePasswordDto } from 'src/dto/auth/change-password.dto';
import { randomBytes } from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(userCreateDto: UserCreateDto) {
    return await this.userService.createRegisterApplicant(userCreateDto);
  }

  async login(email: string, password: string) {
    const user = await this.userService.findUserVerifiedByEmail(email);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Email or password not correct!');

    return signToken(user, this.jwtService);
  }

  private signToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: plainToInstance(User, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async verifyEmailToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_EMAIL_SECRET,
      });

      if (!Object.values(TokenType).includes(payload.type)) {
        throw new UnauthorizedException('Invalid token type');
      }

      if (payload.type === TokenType.EMAIL_INVITE_VERIFY) {
        const user = await this.userService.findByEmail(payload.email);
        if (!user) {
          throw new UnauthorizedException('Account not found');
        }
        if (user.isVerified) {
          return {
            nextStep: 'LOGIN',
            message: 'Account is already activated.',
          };
        }
        return {
          nextStep: 'SET_INITIAL_PASSWORD',
          token,
          email: payload.email,
          role: payload.role,
          message: 'Email verified. Please set your initial password.',
        };
      }

      return await this.userService.verifyAccount(payload);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userService.findByEmail(email);
    const genericResponse = {
      message:
        'If the email exists in the system, reset instructions have been sent.',
    };

    if (!user) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userService.save(user);

    const frontendUrl =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ?? 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/login?resetToken=${token}`;

    try {
      await this.userService.sendPasswordReset(user.email, user.fullName, resetUrl);
    } catch (error) {
      user.resetPasswordToken = null;
      user.resetPasswordTokenExpiresAt = null;
      await this.userService.save(user);
      throw new BadRequestException('Failed to send password reset email.');
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByResetToken(dto.token);
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
    await this.userService.save(user);

    return { message: 'Password has been reset. You can sign in now.' };
  }

  async setInitialPassword(dto: SetInitialPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: process.env.JWT_EMAIL_SECRET,
      });
      if (payload.type !== TokenType.EMAIL_INVITE_VERIFY) {
        throw new UnauthorizedException('Invalid token type');
      }
      const user = await this.userService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Account not found');
      }
      if (user.isVerified) {
        throw new BadRequestException('Account already activated');
      }

      user.password = await bcrypt.hash(dto.password, 10);
      user.role = payload.role as UserRole;
      user.mustChangePassword = false;
      await this.userService.save(user);
      await this.userService.activateInvitedAccount(payload);

      return { message: 'Initial password set successfully.' };
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Token expired');
      }
      throw err;
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }
    const matched = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matched) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    await this.userService.save(user);
    return { message: 'Password updated' };
  }
}
