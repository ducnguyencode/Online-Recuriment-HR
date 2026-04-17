import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_ROLES } from 'src/auth/role.constants';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { LoginHistory } from 'src/entities/login-history.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
  ) {}

  findAll() {
    return this.usersRepository.find({
      order: {
        id: 'DESC',
      },
    }).then((users) =>
      users.map((user) => ({
        id: user.id,
        code: user.code,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        departmentId: user.departmentId,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    );
  }

  async getAuditLogs(currentUser: AuthenticatedUser) {
    const isSuperadmin = currentUser.roles.includes(USER_ROLES.SUPERADMIN);

    const qb = this.loginHistoryRepository
      .createQueryBuilder('lh')
      .leftJoin(User, 'u', 'u.id = lh.userId')
      .select([
        'lh.id AS id',
        'lh.userId AS "userId"',
        'u.fullName AS "fullName"',
        'u.email AS email',
        'u.roles AS roles',
        'lh.ipAddress AS "ipAddress"',
        'lh.userAgent AS "userAgent"',
        'lh.isSuccess AS "isSuccess"',
        'lh.failureReason AS "failureReason"',
        'lh.loggedAt AS "loggedAt"',
      ])
      .orderBy('lh.loggedAt', 'DESC');

    if (!isSuperadmin) {
      qb.andWhere('NOT (:superadminRole = ANY (u.roles))', {
        superadminRole: USER_ROLES.SUPERADMIN,
      });
    }

    const rows = await qb.getRawMany<{
      id: string;
      userId: number;
      fullName: string;
      email: string;
      roles: string[];
      ipAddress: string | null;
      userAgent: string | null;
      isSuccess: boolean;
      failureReason: string | null;
      loggedAt: Date;
    }>();

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      roles: row.roles,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      isSuccess: row.isSuccess,
      failureReason: row.failureReason,
      loggedAt: row.loggedAt,
    }));
  }
}
