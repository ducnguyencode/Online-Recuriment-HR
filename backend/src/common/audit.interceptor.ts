import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import {
  canonicalizeRoles,
  primaryRole,
  USER_ROLES,
} from '../auth/role.constants';

type ReqUser = {
  userId?: number;
  email?: string;
  fullName?: string;
  roles?: string[];
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
      query?: Record<string, unknown>;
      user?: ReqUser;
    }>();
    const method = req.method;
    if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
      return next.handle();
    }
    const raw = (req.originalUrl ?? req.url ?? '').split('?')[0];
    if (raw.includes('/api/auth') || raw.includes('/audit-logs')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const path = raw || '/';
          const user = req.user;
          const canon = user?.roles?.length
            ? canonicalizeRoles(user.roles)
            : [];
          const actorRole = user?.roles?.length ? primaryRole(canon) : 'PUBLIC';
          if (actorRole === USER_ROLES.SUPERADMIN) {
            return;
          }
          const { resourceType, resourceId } = parseResource(path);
          const detail = buildDetail({
            method,
            path,
            resourceType,
            resourceId,
            query: req.query ?? {},
          });
          void this.audit.log({
            actorUserId: user?.userId ?? null,
            actorEmail: user?.email ?? null,
            actorFullName: user?.fullName ?? null,
            actorRole,
            httpMethod: method,
            path,
            resourceType,
            resourceId,
            detail,
          });
        },
      }),
    );
  }
}

function parseResource(path: string): {
  resourceType: string | null;
  resourceId: number | null;
} {
  const parts = path.split('/').filter(Boolean);
  const apiIdx = parts.indexOf('api');
  const seg = apiIdx >= 0 ? parts[apiIdx + 1] : parts[0];
  if (!seg) return { resourceType: null, resourceId: null };
  const last = parts[parts.length - 1];
  const id = /^\d+$/.test(last) ? Number(last) : null;
  return { resourceType: seg ?? null, resourceId: id };
}

function buildDetail(args: {
  method: string;
  path: string;
  resourceType: string | null;
  resourceId: number | null;
  query: Record<string, unknown>;
}): string {
  const noun = (args.resourceType ?? 'resource').replace(/-/g, ' ');
  const target = args.resourceId != null ? `${noun} #${args.resourceId}` : noun;

  if (args.path.endsWith('/status') && args.method === 'PATCH') {
    return `Changed status for ${target}.`;
  }
  if (args.path.endsWith('/change-status') && args.method === 'PATCH') {
    const id = args.query.id ? ` #${String(args.query.id)}` : '';
    const status = args.query.status
      ? ` to "${String(args.query.status)}"`
      : '';
    return `Changed application status${id}${status}.`;
  }

  switch (args.method) {
    case 'POST':
      return `Created ${target}.`;
    case 'PUT':
      return `Updated ${target}.`;
    case 'PATCH':
      return `Partially updated ${target}.`;
    case 'DELETE':
      return `Deleted ${target}.`;
    default:
      return `Accessed ${target}.`;
  }
}
