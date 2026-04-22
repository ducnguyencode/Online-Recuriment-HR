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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminUserFindDto } from 'src/dto/admin/admin-user-find.dto';
import { CreateStaffAccountDto } from 'src/dto/admin/create-staff-account.dto';
import { UpdateStaffRoleDto } from 'src/dto/admin/update-staff-role.dto';
import { User } from 'src/entities/user.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { AdminUserService } from 'src/services/admin-user.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.SUPERADMIN)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async findAll(
    @Query() query: AdminUserFindDto,
  ): Promise<ApiResponse<FindResponseDto<User>>> {
    const data = await this.adminUserService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load staff accounts',
      data,
    };
  }

  @Post()
  async createStaff(
    @Body() dto: CreateStaffAccountDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.createStaff(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Staff account created',
      data,
    };
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffRoleDto,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.updateRole(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff role updated',
      data,
    };
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.deactivate(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff account disabled',
      data,
    };
  }

  @Patch(':id/activate')
  async activate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<User>> {
    const data = await this.adminUserService.activate(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Staff account enabled',
      data,
    };
  }

  @Post(':id/resend-credentials')
  async resendCredentials(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.adminUserService.resendTemporaryPassword(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Temporary credentials re-sent',
      data: null,
    };
  }
}
