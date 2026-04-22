import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Seed } from 'src/database/seed';
import { DataSource } from 'typeorm';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private logger = new Logger(BootstrapService.name);

  constructor(
    private seed: Seed,
    private readonly dataSource: DataSource,
  ) {}

  /** Best-effort patches so older Postgres schemas match the current User entity. */
  private async ensureLegacyUserColumns(): Promise<void> {
    const statements = [
      `DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
          ) THEN
            ALTER TABLE users ADD COLUMN "role" character varying NOT NULL DEFAULT 'Applicant';
          END IF;
        END $$;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone character varying`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false`,
      `DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'roles'
            AND udt_name IN ('_text', '_varchar')
        ) THEN
          ALTER TABLE users DROP COLUMN roles;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'roles'
        ) THEN
          ALTER TABLE users ADD COLUMN roles character varying(512);
        END IF;
      END $$;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordToken" character varying`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordTokenExpiresAt" TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationToken" character varying`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "invitedUserExpiresAt" TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ`,
      `ALTER TABLE users DROP COLUMN IF EXISTS "employeeId"`,
      `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS "fullName" character varying`,
      `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS email character varying`,
      `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS user_id integer`,
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_applicants_user'
        ) THEN
          ALTER TABLE applicants
            ADD CONSTRAINT "FK_applicants_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;`,
      `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()`,
      `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()`,
    ];
    for (const sql of statements) {
      try {
        await this.dataSource.query(sql);
      } catch (e) {
        this.logger.warn(
          `Legacy user column patch skipped: ${sql.slice(0, 60)}…`,
          e as Error,
        );
      }
    }
  }

  /**
   * Some legacy databases have users/applicants but never created HR tables.
   * TypeORM still LEFT JOINs `employees` when loading User with that relation.
   */
  private async ensureHrTablesIfMissing(): Promise<void> {
    try {
      const rows: { exists: string }[] = await this.dataSource.query(
        `SELECT to_regclass('public.employees')::text AS exists`,
      );
      if (rows?.[0]?.exists) return;
    } catch (e) {
      this.logger.warn('Could not check employees table', e as Error);
      return;
    }
    const ddl = [
      `CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        code character varying GENERATED ALWAYS AS (
          ('D' || LPAD(id::text, 4, '0'))::character varying
        ) STORED NOT NULL,
        name character varying(255) NOT NULL,
        description text,
        "isActive" boolean NOT NULL DEFAULT true
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_department_name" ON departments (name)`,
      `CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        code character varying GENERATED ALWAYS AS (
          ('E' || LPAD(id::text, 4, '0'))::character varying
        ) STORED NOT NULL,
        "user_id" integer NOT NULL,
        "departmentId" integer,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_employees_user" FOREIGN KEY ("user_id") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT "FK_employees_department" FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_user" ON employees ("user_id")`,
    ];
    for (const sql of ddl) {
      try {
        await this.dataSource.query(sql);
      } catch (e) {
        this.logger.warn(
          `HR table bootstrap skipped: ${sql.slice(0, 80)}…`,
          e as Error,
        );
      }
    }
  }

  /**
   * Legacy DBs may miss ownership columns recently added to Vacancy entity.
   */
  private async ensureVacancyColumns(): Promise<void> {
    const statements = [
      `ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS "createdById" integer`,
      `ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS "filledCount" integer NOT NULL DEFAULT 0`,
      `ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS "numberOfOpenings" integer NOT NULL DEFAULT 1`,
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vacancy_created_by_user'
        ) THEN
          ALTER TABLE vacancies
            ADD CONSTRAINT "FK_vacancy_created_by_user"
            FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT;
        END IF;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;`,
    ];
    for (const sql of statements) {
      try {
        await this.dataSource.query(sql);
      } catch (e) {
        this.logger.warn(
          `Vacancy patch skipped: ${sql.slice(0, 60)}…`,
          e as Error,
        );
      }
    }
  }

  async onApplicationBootstrap() {
    await this.ensureLegacyUserColumns();
    await this.ensureHrTablesIfMissing();
    await this.ensureVacancyColumns();
    if (process.env.SKIP_SEED === 'true') {
      this.logger.log('Skipping seed (SKIP_SEED=true)');
      return;
    }
    await this.seed.runSeed();
    // await this.userService.ensureDefaultAdmin();
  }
}
