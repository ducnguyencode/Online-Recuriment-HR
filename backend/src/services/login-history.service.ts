import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginHistory } from 'src/entities/login-history.entity';
import { Repository } from 'typeorm';

export interface LoginHistoryContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepo: Repository<LoginHistory>,
  ) {}

  async record(input: {
    email: string;
    userId?: number | null;
    status: 'SUCCESS' | 'FAILED';
    failureReason?: string | null;
    context?: LoginHistoryContext;
  }): Promise<void> {
    const row = this.loginHistoryRepo.create({
      userId: input.userId ?? null,
      email: input.email.trim().toLowerCase(),
      ipAddress: input.context?.ipAddress ?? null,
      userAgent: input.context?.userAgent ?? null,
      status: input.status,
      failureReason: input.failureReason ?? null,
    });

    await this.loginHistoryRepo.save(row);
  }

  async list(input: {
    limit?: number;
    email?: string;
    status?: 'SUCCESS' | 'FAILED';
  }) {
    const qb = this.loginHistoryRepo.createQueryBuilder('history');

    if (input.email?.trim()) {
      qb.andWhere('history.email = :email', {
        email: input.email.trim().toLowerCase(),
      });
    }

    if (input.status) {
      qb.andWhere('history.status = :status', { status: input.status });
    }

    qb.orderBy('history.createdAt', 'DESC').take(input.limit ?? 200);
    return qb.getMany();
  }
}
