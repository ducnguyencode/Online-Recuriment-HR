import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorator/decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChangePasswordDto } from 'src/dto/auth/change-password.dto';
import { ForgotPasswordDto } from 'src/dto/auth/forgot-password.dto';
import { LoginDto } from 'src/dto/auth/login.dto';
import { SetInitialPasswordDto } from 'src/dto/auth/set-initial-password.dto';
import { ResetPasswordDto } from 'src/dto/auth/reset-password.dto';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() userCreateDto: UserCreateDto) {
    const data = await this.authService.register(userCreateDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Register success',
      data: data,
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const data = await this.authService.verifyEmailToken(token);
    const verifyData = data as any;
    const message =
      verifyData?.nextStep === 'SET_INITIAL_PASSWORD'
        ? 'Email verified. Continue to set your initial password.'
        : 'Account is verified! You can login now.';
    return {
      statusCode: HttpStatus.OK,
      message,
      data: data,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Login success',
      data: data,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @Post('set-initial-password')
  async setInitialPassword(@Body() dto: SetInitialPasswordDto) {
    const data = await this.authService.setInitialPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: SafeUserDto) {
    const data = await this.userService.findById(user.id);
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Login success',
      data: data,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: SafeUserDto,
    @Body() dto: ChangePasswordDto,
  ) {
    const data = await this.authService.changePassword(user.id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
    };
  }
}
