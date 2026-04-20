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
import { UserCreateDto } from 'src/dto/user/user.create.dto';
import { AuthService } from 'src/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
