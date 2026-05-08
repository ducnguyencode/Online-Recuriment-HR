import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AuditLogService } from 'src/services/audit-log.service';

type SafeRecord = Record<string, unknown>;

@Injectable()
export class ActivityAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: any }>();
    const res = http.getResponse<Response>();

    if (!this.shouldAudit(req)) {
      return next.handle();
    }

    const actorId = Number(req.user?.id);
    const actorRole = String(req.user?.role ?? '');
    if (!Number.isFinite(actorId) || !actorRole) {
      return next.handle();
    }

    const action = this.buildAction(req);
    const targetId = this.readTargetId(req);
    const payload = {
      method: req.method,
      path: req.path,
      params: this.sanitize(req.params as SafeRecord),
      query: this.sanitize(req.query as SafeRecord),
      body: this.sanitize(req.body as SafeRecord),
    };

    return next.handle().pipe(
      tap({
        next: async (result) => {
          if (res.statusCode >= 400) {
            return;
          }
          const resolvedTargetId =
            targetId ?? this.readTargetIdFromResponse(result);
          await this.auditLogService.createLog({
            actorId,
            actorRoleSnapshot: actorRole,
            actorFullName: String(req.user?.fullName ?? ''),
            action,
            targetId: resolvedTargetId,
            payload,
            context: {
              ipAddress: this.readIp(req),
              userAgent: req.get('user-agent') ?? null,
            },
          });
        },
      }),
    );
  }

  private shouldAudit(req: Request & { user?: any }): boolean {
    if (!req.user) return false;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;

    const path = req.path.toLowerCase();
    if (path.startsWith('/api/admin/audit-logs')) return false;
    if (path.startsWith('/api/admin/login-history')) return false;
    if (
      path.startsWith('/api/auth/login') ||
      path.startsWith('/api/auth/logout') ||
      path.startsWith('/api/auth/register') ||
      path.startsWith('/api/auth/verify-email') ||
      path.startsWith('/api/auth/resend-verify') ||
      path.startsWith('/api/auth/forgot-password') ||
      path.startsWith('/api/auth/reset-password')
    ) {
      return false;
    }
    return true;
  }

  private buildAction(req: Request): string {
    const methodActionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'PATCH',
      DELETE: 'DELETE',
    };
    const actionSuffix = methodActionMap[req.method] ?? req.method;
    const resource = this.readResource(req.path);
    return `${resource}_${actionSuffix}`;
  }

  private readResource(path: string): string {
    const chunks = path
      .replace(/^\/api\//, '')
      .split('/')
      .filter(Boolean);
    if (!chunks.length) return 'SYSTEM';

    const first = chunks[0];
    const second = chunks[1];
    const raw = first === 'admin' && second ? second : first;
    return raw.replace(/-/g, '_').toUpperCase();
  }

  private readTargetId(req: Request): number | null {
    const candidates = [
      (req.params as SafeRecord)?.id,
      (req.query as SafeRecord)?.id,
      (req.body as SafeRecord)?.id,
      (req.body as SafeRecord)?.targetId,
    ];
    for (const item of candidates) {
      const parsed = Number(item);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private readTargetIdFromResponse(result: unknown): number | null {
    if (!result || typeof result !== 'object') return null;
    const root = result as SafeRecord;
    const data = root.data;
    if (!data || typeof data !== 'object') return null;
    const entity = data as SafeRecord;
    const candidates = [entity.id, entity.targetId, entity.userId];
    for (const item of candidates) {
      const parsed = Number(item);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private sanitize(input: unknown): unknown {
    if (!input || typeof input !== 'object') {
      return input ?? null;
    }
    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    const hiddenKeys = new Set([
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'token',
      'access_token',
      'verificationToken',
      'resetPasswordToken',
    ]);

    const src = input as SafeRecord;
    const out: SafeRecord = {};
    for (const [key, value] of Object.entries(src)) {
      if (hiddenKeys.has(key)) {
        out[key] = '[REDACTED]';
        continue;
      }
      out[key] = this.sanitize(value);
    }
    return out;
  }

  private readIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? null;
  }
}
