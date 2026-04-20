/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/entities/user.entity';
import { TokenType } from 'src/common/enum';
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { TokenExpiredError } from 'jsonwebtoken';
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

    return this.signToken(user);
  }

  private signToken(user: any) {
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

      return await this.userService.verifyAccount(payload);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new RequestTimeoutException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}
