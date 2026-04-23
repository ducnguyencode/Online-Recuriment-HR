import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminUserFindDto } from 'src/dto/admin/admin-user-find.dto';
import { CreateStaffAccountDto } from 'src/dto/admin/create-staff-account.dto';
import { UpdateStaffRoleDto } from 'src/dto/admin/update-staff-role.dto';
import { UpdateStaffAccountDto } from 'src/dto/admin/update-staff-account.dto';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { AdminUserService } from 'src/services/admin-user.service';
import { User } from 'src/entities/user.entity';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.HR)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async findAll(
    @CurrentUser() actor: SafeUserDto,
    @Query() query: AdminUserFindDto,
  ): Promise<ApiResponse<FindResponseDto<User>>> {
    const data = await this.adminUserService.findAll(actor, query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load staff accounts',
      data,
    };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async createStaff(
    @CurrentUser() actor: SafeUserDto,
    @Body() dto: CreateStaffAccountDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.createStaff(actor, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Staff account created',
      data,
    };
  }

  @Patch(':id')
  async updateStaff(
    @CurrentUser() actor: SafeUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffAccountDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.updateStaff(actor, id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff account updated',
      data,
    };
  }

  @Get(':id/role-change-preconditions')
  @Roles(UserRole.SUPER_ADMIN)
  async getRolePreconditions(
    @Param('id', ParseIntPipe) id: number,
    @Query('newRole') newRole: UserRole,
  ) {
    const data = await this.adminUserService.getRoleChangePreconditions(
      id,
      newRole,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data,
    };
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  async updateRole(
    @CurrentUser() actor: SafeUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffRoleDto,
    @Req() req: any,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.updateRole(actor.id, id, dto, req);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff role updated',
      data,
    };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  async deactivate(
    @CurrentUser() actor: SafeUserDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.deactivate(actor, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff account disabled',
      data,
    };
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  async activate(
    @CurrentUser() actor: SafeUserDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.activate(actor, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff account enabled',
      data,
    };
  }

  @Post(':id/resend-invite')
  async resendInvite(
    @CurrentUser() actor: SafeUserDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.adminUserService.resendInvite(actor, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Invitation re-sent',
      data: null,
    };
  }

}
