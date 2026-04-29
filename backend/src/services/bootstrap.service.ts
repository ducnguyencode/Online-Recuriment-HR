import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserService } from './user.service';
import { Seed } from 'src/database/seed';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private logger = new Logger(BootstrapService.name);

  constructor(
    private userService: UserService,
    private seed: Seed,
  ) {}

  async onApplicationBootstrap() {
    // await this.seed.runSeed();
    await this.userService.ensureDefaultAdmin();
  }
}
