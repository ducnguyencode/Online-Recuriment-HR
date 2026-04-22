import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { USER_ROLES } from '../auth/role.constants';

export type AuditViewer = {
  userId: number;
  roles: string[];
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logs: Repository<ActivityLog>,
  ) {}

  async log(entry: {
    actorUserId: number | null;
    actorEmail: string | null;
    actorFullName: string | null;
    actorRole: string;
    httpMethod: string;
    path: string;
    resourceType: string | null;
    resourceId: number | null;
    detail: string | null;
  }): Promise<void> {
    try {
      const row = this.logs.create(entry);
      await this.logs.save(row);
    } catch (e) {
      console.error('[audit] persist failed', e);
    }
  }

  async listForViewer(viewer: AuditViewer): Promise<ActivityLog[]> {
    const roles = viewer.roles ?? [];
    const isSuperadmin = roles.includes(USER_ROLES.SUPERADMIN);
    const isHr = roles.includes(USER_ROLES.HR);

    const qb = this.logs
      .createQueryBuilder('a')
      .where("a.path NOT LIKE '/api/auth/%'")
      .andWhere('a.httpMethod IN (:...methods)', {
        methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      })
      .orderBy('a.createdAt', 'DESC')
      .take(300);

    if (isSuperadmin) {
      qb.andWhere('a.actorRole IN (:...allowed)', {
        allowed: [
          USER_ROLES.HR,
          USER_ROLES.INTERVIEWER,
          USER_ROLES.APPLICANT,
          'PUBLIC',
        ],
      });
      qb.andWhere('(a.actorUserId IS NULL OR a.actorUserId != :viewerId)', {
        viewerId: viewer.userId,
      });
    } else if (isHr) {
      qb.andWhere('a.actorRole IN (:...hrAllowed)', {
        hrAllowed: [USER_ROLES.INTERVIEWER, USER_ROLES.APPLICANT, 'PUBLIC'],
      });
      qb.andWhere('(a.actorUserId IS NULL OR a.actorUserId != :hrViewerId)', {
        hrViewerId: viewer.userId,
      });
    } else {
      return [];
    }

    return qb.getMany();
  }
}
