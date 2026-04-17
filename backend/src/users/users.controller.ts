import { Controller, Get, HttpStatus } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/auth.types';
import { USER_ROLES } from 'src/auth/role.constants';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(USER_ROLES.SUPERADMIN)
  async findAll() {
    const data = await this.usersService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Users fetched successfully',
      data,
    };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Current user fetched successfully',
      data: user,
    };
  }

  @Get('auditlogs')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR)
  async getAuditLogs(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.getAuditLogs(user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Audit logs fetched successfully',
      data,
    };
  }
}
