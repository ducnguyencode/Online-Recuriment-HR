import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/audit-log.entity';
import { EntityManager, Repository } from 'typeorm';

export interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  async createRoleChangedLog(input: {
    actorId: number;
    actorRoleSnapshot: string;
    targetId: number;
    fromRole: string;
    toRole: string;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const row = this.auditLogs.create({
      actorId: input.actorId,
      actorRoleSnapshot: input.actorRoleSnapshot,
      action: 'ROLE_CHANGED',
      targetId: input.targetId,
      targetRoleSnapshot: input.fromRole,
      payload: {
        fromRole: input.fromRole,
        toRole: input.toRole,
        reason: input.reason,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    if (input.manager) {
      await input.manager.save(AuditLog, row);
      return;
    }
    await this.auditLogs.save(row);
  }

  async createLog(input: {
    actorId?: number | null;
    actorRoleSnapshot: string;
    actorFullName?: string | null;
    action: string;
    targetId?: number | null;
    targetRoleSnapshot?: string | null;
    payload?: Record<string, unknown> | null;
    context?: AuditContext;
    manager?: EntityManager;
  }): Promise<void> {
    const row = this.auditLogs.create({
      actorId: input.actorId ?? null,
      actorRoleSnapshot: input.actorRoleSnapshot,
      action: input.action,
      targetId: input.targetId ?? null,
      targetRoleSnapshot: input.targetRoleSnapshot ?? null,
      payload: {
        ...(input.payload ?? {}),
        actorFullName: input.actorFullName ?? null,
        ipAddress: input.context?.ipAddress ?? null,
        userAgent: input.context?.userAgent ?? null,
      },
    });

    if (input.manager) {
      await input.manager.save(AuditLog, row);
      return;
    }
    await this.auditLogs.save(row);
  }

  async list(input: {
    limit?: number;
    actorId?: number;
    targetId?: number;
    actorRoles?: string[];
    action?: string;
    from?: Date;
    to?: Date;
  }): Promise<AuditLog[]> {
    const qb = this.auditLogs.createQueryBuilder('log');

    if (typeof input.actorId === 'number') {
      qb.andWhere('log.actorId = :actorId', { actorId: input.actorId });
    }

    if (typeof input.targetId === 'number') {
      qb.andWhere('log.targetId = :targetId', { targetId: input.targetId });
    }
    if (input.actorRoles?.length && input.actorRoles) {
      qb.andWhere('log.actorRoleSnapshot IN (:...actorRoles)', {
        actorRoles: input.actorRoles,
      });
    }
    // if (input.action?.trim()) {
    //   qb.andWhere('log.action ILIKE :action', {
    //     action: `%${input.action.trim()}%`,
    //   });
    // }
    // if (input.from) {
    //   qb.andWhere('log.createdAt >= :from', { from: input.from });
    // }
    // if (input.to) {
    //   qb.andWhere('log.createdAt <= :to', { to: input.to });
    // }

    qb.orderBy('log.createdAt', 'DESC').take(input.limit ?? 200);
    return qb.getMany();
  }
}
