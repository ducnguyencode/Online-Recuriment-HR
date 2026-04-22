import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/audit-log.entity';
import { Repository } from 'typeorm';

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
    await this.auditLogs.save(row);
  }

  async list(limit = 200): Promise<AuditLog[]> {
    return this.auditLogs.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
