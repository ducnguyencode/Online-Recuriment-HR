import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { LoginHistoryService } from 'src/services/login-history.service';

@Controller('admin/login-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.HR)
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Get()
  async list(
    @Query('limit') limit?: string,
    @Query('email') email?: string,
    @Query('status') status?: 'SUCCESS' | 'FAILED',
  ) {
    const size = Number(limit) > 0 ? Number(limit) : 200;
    const data = await this.loginHistoryService.list({
      limit: size,
      email,
      status: status === 'SUCCESS' || status === 'FAILED' ? status : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data,
    };
  }
}
