import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AuthService } from './auth.service';

/** Periodically removes expired signup_verifications (24h unverified). */
@Injectable()
export class SignupCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SignupCleanupService.name);

  constructor(private readonly auth: AuthService) {}

  onApplicationBootstrap(): void {
    void this.run();
    setInterval(() => void this.run(), 60 * 60 * 1000);
  }

  private async run(): Promise<void> {
    try {
      await this.auth.purgeExpiredSignupVerifications();
    } catch (e) {
      this.logger.warn('purgeExpiredSignupVerifications failed', e);
    }
  }
}
