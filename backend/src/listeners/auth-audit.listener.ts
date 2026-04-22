import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../services/audit.service';
import {
  canonicalizeRoles,
  primaryRole,
  USER_ROLES,
} from '../auth/role.constants';

export type AuthLoginAuditPayload = {
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
  portal: string;
};

@Injectable()
export class AuthAuditListener {
  constructor(private readonly audit: AuditService) {}

  @OnEvent('auth.login')
  handleLogin(payload: AuthLoginAuditPayload): void {
    const roles = canonicalizeRoles(payload.roles);
    if (roles.includes(USER_ROLES.SUPERADMIN)) {
      return;
    }
    void this.audit.log({
      actorUserId: payload.userId,
      actorEmail: payload.email,
      actorFullName: payload.fullName,
      actorRole: primaryRole(roles),
      httpMethod: 'POST',
      path: '/api/auth/login',
      resourceType: 'login',
      resourceId: null,
      detail: `Signed in (portal: ${payload.portal})`,
    });
  }
}
