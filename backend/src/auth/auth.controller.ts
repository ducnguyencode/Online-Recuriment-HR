import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/employee')
  registerEmployee(@Body() payload: RegisterEmployeeDto) {
    return this.authService.registerEmployee(payload);
  }

  @Post('register/applicant')
  registerApplicant(@Body() payload: RegisterApplicantDto) {
    return this.authService.registerApplicant(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto, @Req() request: Request) {
    return this.authService.login(payload, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }
}
