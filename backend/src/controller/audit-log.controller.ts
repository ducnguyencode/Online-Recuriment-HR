import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { USER_ROLES } from '../auth/role.constants';
import { AuditService, AuditViewer } from '../services/audit.service';

type JwtReq = { user: AuditViewer };

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR)
  async list(@Req() req: JwtReq) {
    const rows = await this.audit.listForViewer(req.user);
    const data = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      actorFullName: r.actorFullName ?? '—',
      actorEmail: r.actorEmail ?? '—',
      actorRole: r.actorRole,
      httpMethod: r.httpMethod,
      path: r.path,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      detail: r.detail,
    }));
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data,
    };
  }
}
