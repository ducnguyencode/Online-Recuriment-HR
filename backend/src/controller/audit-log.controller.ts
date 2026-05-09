import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorator/decorator';
import { Roles } from 'src/common/decorator/decorator';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditLogService } from 'src/services/audit-log.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.HR)
export class AuditLogController {
  constructor(private readonly auditLogs: AuditLogService) {}

  @Get()
  async list(
    @CurrentUser() user: SafeUserDto,
    @Query('limit') limit?: string,
    @Query('actorId') actorId?: string,
    @Query('targetId') targetId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const size = Number(limit) > 0 ? Number(limit) : 200;
    const actor = Number(actorId);
    const target = Number(targetId);
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const actorRolesByAccess =
      user.role === UserRole.SUPER_ADMIN
        ? [
            // UserRole.SUPER_ADMIN, // hidden from audit log list
            UserRole.HR,
            UserRole.INTERVIEWER,
          ]
        : [UserRole.INTERVIEWER];

    const data = await this.auditLogs.list({
      limit: size,
      actorId: Number.isFinite(actor) ? actor : undefined,
      targetId: Number.isFinite(target) ? target : undefined,
      actorRoles: actorRolesByAccess,
      action,
      from:
        fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data,
    };
  }
}
