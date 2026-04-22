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
import { LoginDto } from 'src/dto/auth/login.dto';
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
    return {
      statusCode: HttpStatus.OK,
      message: 'Account is verified! You can login now.',
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
}
