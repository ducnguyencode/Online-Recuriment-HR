import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbCompatService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DbCompatService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.patchInterviewFinalResult();
      await this.patchVacancyStatuses();
      await this.patchApplicantStatuses();
    } catch (error) {
      this.logger.warn('DB compatibility patch failed', error as Error);
    }
  }

  private async patchInterviewFinalResult(): Promise<void> {
    await this.dataSource.query(`
      ALTER TABLE interviews
      ADD COLUMN IF NOT EXISTS "finalResult" VARCHAR(32) NOT NULL DEFAULT 'Pending'
    `);
  }

  private async patchVacancyStatuses(): Promise<void> {
    await this.dataSource.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacancies_status_enum') THEN
          EXECUTE 'ALTER TYPE vacancies_status_enum ADD VALUE IF NOT EXISTS ''Open''';
          EXECUTE 'ALTER TYPE vacancies_status_enum ADD VALUE IF NOT EXISTS ''Close''';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacancy_status_enum') THEN
          EXECUTE 'ALTER TYPE vacancy_status_enum ADD VALUE IF NOT EXISTS ''Open''';
          EXECUTE 'ALTER TYPE vacancy_status_enum ADD VALUE IF NOT EXISTS ''Close''';
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
      UPDATE vacancies
      SET status = 'Open'
      WHERE status::text = 'Opened'
    `);
    await this.dataSource.query(`
      UPDATE vacancies
      SET status = 'Close'
      WHERE status::text = 'Closed'
    `);
  }

  private async patchApplicantStatuses(): Promise<void> {
    await this.dataSource.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicants_status_enum') THEN
          EXECUTE 'ALTER TYPE applicants_status_enum ADD VALUE IF NOT EXISTS ''Not in Process''';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicant_status_enum') THEN
          EXECUTE 'ALTER TYPE applicant_status_enum ADD VALUE IF NOT EXISTS ''Not in Process''';
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
      UPDATE applicants
      SET status = 'Not in Process'
      WHERE status::text = 'Not In Process'
    `);
  }
}
