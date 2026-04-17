import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from 'src/dto/forgot-password.dto';
import { LoginDto } from 'src/dto/login.dto';
import { RegisterApplicantDto } from 'src/dto/register-applicant.dto';
import { RegisterEmployeeDto } from 'src/dto/register-employee.dto';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './auth-user.interface';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/employee')
  registerEmployee(@Body() payload: RegisterEmployeeDto) {
    return this.authService.registerEmployee(payload);
  }

  @Public()
  @Post('register/applicant')
  registerApplicant(@Body() payload: RegisterApplicantDto) {
    return this.authService.registerApplicant(payload);
  }

  @Public()
  @Post('login')
  login(@Body() payload: LoginDto, @Req() request: Request) {
    return this.authService.login(payload, request);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Current user fetched successfully',
      data: this.authService.getProfile(user),
    };
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() payload: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user, payload);
  }
}
