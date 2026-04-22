-- PostgreSQL schema aligned with test/Online-Recuriment-HR (TypeORM entities:
-- departments, applicants, vacancies, cvs, applications, interviews, users,
-- activity_logs, signup_verifications).
-- Bản sao cho team (cùng nội dung + hướng dẫn import): scripts/backup.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicants_status_enum') THEN
    CREATE TYPE applicants_status_enum AS ENUM (
      'Not in Process',
      'In Process',
      'Hired',
      'Banned'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applications_status_enum') THEN
    CREATE TYPE applications_status_enum AS ENUM (
      'Pending',
      'Screening',
      'Interview Scheduled',
      'Selected',
      'Rejected',
      'Not Required'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacancies_status_enum') THEN
    CREATE TYPE vacancies_status_enum AS ENUM (
      'Open',
      'Suspended',
      'Close'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  name VARCHAR NOT NULL,
  description TEXT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_department_name'
  ) THEN
    ALTER TABLE departments ADD CONSTRAINT "UQ_department_name" UNIQUE (name);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS applicants (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "fullName" VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NULL,
  status applicants_status_enum NOT NULL DEFAULT 'Not in Process',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_applicant_email'
  ) THEN
    ALTER TABLE applicants ADD CONSTRAINT "UQ_applicant_email" UNIQUE (email);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vacancies (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "departmentId" INT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  "numberOfOpenings" INT NOT NULL DEFAULT 1,
  "filledCount" INT NOT NULL DEFAULT 0,
  status vacancies_status_enum NOT NULL DEFAULT 'Open',
  "closingDate" DATE NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_vacancies_department
    FOREIGN KEY ("departmentId")
    REFERENCES departments(id)
    ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_vacancy_title_department'
  ) THEN
    ALTER TABLE vacancies
    ADD CONSTRAINT "UQ_vacancy_title_department" UNIQUE (title, "departmentId");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS cvs (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "applicantId" INT NOT NULL,
  "fileUrl" VARCHAR NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cvs_applicant
    FOREIGN KEY ("applicantId")
    REFERENCES applicants(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "applicantId" INT NOT NULL,
  "vacancyId" INT NOT NULL,
  "cvId" INT NULL,
  status applications_status_enum NOT NULL DEFAULT 'Pending',
  "aiPreview" JSONB NULL,
  "hrNotes" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_applications_applicant
    FOREIGN KEY ("applicantId")
    REFERENCES applicants(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_applications_vacancy
    FOREIGN KEY ("vacancyId")
    REFERENCES vacancies(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_applications_cv
    FOREIGN KEY ("cvId")
    REFERENCES cvs(id)
    ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_applicant_vacancy'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT "UQ_applicant_vacancy" UNIQUE ("vacancyId", "applicantId");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NULL,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NOT NULL,
  "googleMeetLink" VARCHAR NULL,
  "googleCalendarEventId" VARCHAR NULL,
  "finalResult" VARCHAR(32) NOT NULL DEFAULT 'Pending',
  "applicationId" INT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_interviews_application
    FOREIGN KEY ("applicationId")
    REFERENCES applications(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_vacancies_department_id ON vacancies("departmentId");
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews("applicationId");

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "fullName" VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  "passwordHash" VARCHAR NOT NULL,
  roles VARCHAR(32)[] NOT NULL DEFAULT ARRAY['APPLICANT']::varchar[],
  "applicantId" INT NULL,
  "departmentId" INT NULL,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "resetPasswordToken" VARCHAR NULL,
  "resetPasswordTokenExpiresAt" TIMESTAMPTZ NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_applicant
    FOREIGN KEY ("applicantId")
    REFERENCES applicants(id)
    ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_email'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT "UQ_users_email" UNIQUE (email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Demo accounts (password: 123456) — bcrypt hash generated for this seed
INSERT INTO users ("fullName", email, "passwordHash", roles, "applicantId", "mustChangePassword", "isActive")
VALUES
  ('Super Admin', 'superadmin@demo.local', '$2b$10$yH0C/HU3exM1G5q/xhwjHeeGzqBSXp.O9IStsz9I5/KTBIzDG4IgK', ARRAY['SUPERADMIN']::varchar[], NULL, false, true),
  ('HR Manager', 'hr@demo.local', '$2b$10$yH0C/HU3exM1G5q/xhwjHeeGzqBSXp.O9IStsz9I5/KTBIzDG4IgK', ARRAY['HR']::varchar[], NULL, false, true),
  ('Interviewer', 'interviewer@demo.local', '$2b$10$yH0C/HU3exM1G5q/xhwjHeeGzqBSXp.O9IStsz9I5/KTBIzDG4IgK', ARRAY['INTERVIEWER']::varchar[], NULL, false, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO applicants ("fullName", email, phone, status, "isActive")
SELECT 'Demo Applicant', 'applicant@demo.local', NULL, 'Not in Process', true
WHERE NOT EXISTS (SELECT 1 FROM applicants WHERE email = 'applicant@demo.local');

INSERT INTO users ("fullName", email, "passwordHash", roles, "applicantId", "mustChangePassword", "isActive")
SELECT 'Demo Applicant', 'applicant@demo.local', '$2b$10$yH0C/HU3exM1G5q/xhwjHeeGzqBSXp.O9IStsz9I5/KTBIzDG4IgK', ARRAY['APPLICANT']::varchar[], a.id, false, true
FROM applicants a
WHERE a.email = 'applicant@demo.local'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'applicant@demo.local');

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" INT NULL,
  "actorEmail" VARCHAR(255) NULL,
  "actorFullName" VARCHAR(255) NULL,
  "actorRole" VARCHAR(64) NOT NULL,
  "httpMethod" VARCHAR(10) NOT NULL,
  path VARCHAR(512) NOT NULL,
  "resourceType" VARCHAR(64) NULL,
  "resourceId" INT NULL,
  detail TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs ("createdAt" DESC);

CREATE TABLE IF NOT EXISTS signup_verifications (
  email VARCHAR(255) PRIMARY KEY,
  code VARCHAR(12) NULL,
  "verifyToken" VARCHAR(64) NULL,
  "pendingFullName" VARCHAR(255) NULL,
  "pendingPasswordHash" VARCHAR(255) NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signup_verifications_verify_token
  ON signup_verifications ("verifyToken")
  WHERE "verifyToken" IS NOT NULL;

DO $$
BEGIN
  ALTER TABLE signup_verifications ALTER COLUMN code DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'signup_verifications' AND column_name = 'verifyToken'
  ) THEN
    ALTER TABLE signup_verifications ADD COLUMN "verifyToken" VARCHAR(64) NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'signup_verifications' AND column_name = 'pendingFullName'
  ) THEN
    ALTER TABLE signup_verifications ADD COLUMN "pendingFullName" VARCHAR(255) NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'signup_verifications' AND column_name = 'pendingPasswordHash'
  ) THEN
    ALTER TABLE signup_verifications ADD COLUMN "pendingPasswordHash" VARCHAR(255) NULL;
  END IF;
END $$;

COMMIT;
