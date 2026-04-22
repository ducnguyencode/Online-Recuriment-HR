import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthService as LegacyAuthService } from '../services/auth.service';
import { ChangePasswordDto } from '../dto/auth/change-password.dto';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterApplicantDto } from '../dto/auth/register-applicant.dto';
import { RegisterApplicantRequestDto } from '../dto/auth/register-applicant-request.dto';
import { CompleteRegisterDto } from '../dto/auth/complete-register.dto';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserCreateDto } from '../dto/user/user.create.dto';
import { authViewToLegacyUser, loginPayload } from './login-response.mapper';

type JwtReq = { user: { userId: number } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly legacyAuth: LegacyAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  async login(@Body() dto: LoginDto) {
    const { token, user } = await this.auth.login(dto);
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Login success',
      data: loginPayload(token, user),
    };
  }

  @Public()
  @Post('register')
  async register(@Body() userCreateDto: UserCreateDto) {
    const data = await this.legacyAuth.register(userCreateDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Register success',
      data,
    };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const data = await this.legacyAuth.verifyEmailToken(token);
    return {
      statusCode: HttpStatus.OK,
      message: 'Account is verified! You can login now.',
      data,
    };
  }

  @Public()
  @Post('register/applicant/request')
  async requestRegisterApplicant(@Body() dto: RegisterApplicantRequestDto) {
    const data = await this.auth.requestRegisterApplicant(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @Public()
  @Post('register/applicant/complete')
  async completeRegisterApplicant(@Body() dto: CompleteRegisterDto) {
    const { token, user } = await this.auth.completeRegisterApplicant(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Account created',
      data: {
        ...authViewToLegacyUser(user),
        access_token: token,
      },
    };
  }

  @Public()
  @Post('register/applicant')
  async registerApplicant(@Body() dto: RegisterApplicantDto) {
    const { token, user } = await this.auth.registerApplicant(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Account created',
      data: {
        ...authViewToLegacyUser(user),
        access_token: token,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgot(@Body() dto: ForgotPasswordDto) {
    const data = await this.auth.forgotPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async reset(@Body() dto: ResetPasswordDto) {
    const data = await this.auth.resetPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: JwtReq) {
    const data = await this.auth.me(req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: authViewToLegacyUser(data),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: JwtReq, @Body() dto: ChangePasswordDto) {
    const data = await this.auth.changePassword(req.user.userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }
}
