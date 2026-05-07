import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/services/user.service';

@Injectable()
export class AccountCleanupCronService {
  private readonly logger = new Logger(AccountCleanupCronService.name);

  constructor(
    private readonly users: UserService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupStaleUnverifiedAccounts() {
    const graceDaysRaw =
      this.config.get<string>('UNVERIFIED_ACCOUNT_CLEANUP_DAYS') ?? '7';
    const graceDays = Math.max(1, Number(graceDaysRaw) || 7);
    const removed =
      await this.users.cleanupExpiredUnverifiedAccounts(graceDays);
    if (removed > 0) {
      this.logger.log(
        `Removed ${removed} unverified expired account(s) older than ${graceDays} days.`,
      );
    }
  }
}
