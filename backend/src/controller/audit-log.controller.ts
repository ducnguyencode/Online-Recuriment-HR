import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/decorator';
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
  async list(@Query('limit') limit?: string) {
    const size = Number(limit) > 0 ? Number(limit) : 200;
    const data = await this.auditLogs.list(size);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data,
    };
  }
}
