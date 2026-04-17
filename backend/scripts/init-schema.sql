-- Active: 1776403792413@@127.0.0.1@5432@postgres


BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicants_status_enum') THEN
    CREATE TYPE applicants_status_enum AS ENUM (
      'Not In Process',
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
      'Opened',
      'Suspended',
      'Closed'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_accounts_role_enum') THEN
    CREATE TYPE user_accounts_role_enum AS ENUM (
      'HR',
      'Interviewer',
      'Applicant'
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
  status applicants_status_enum NOT NULL DEFAULT 'Not In Process',
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

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  code VARCHAR NULL,
  "fullName" VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  "passwordHash" VARCHAR NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  "departmentId" UUID NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_user_email'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT "UQ_user_email" UNIQUE (email);
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
  status vacancies_status_enum NOT NULL DEFAULT 'Opened',
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

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "departmentId" INT NULL,
  "fullName" VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  "jobTitle" VARCHAR(100) NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_employees_department
    FOREIGN KEY ("departmentId")
    REFERENCES departments(id)
    ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_employees_email'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT "UQ_employees_email" UNIQUE (email);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" UUID NULL,
  "applicantId" INT NULL,
  email VARCHAR(120) NOT NULL,
  "passwordHash" VARCHAR NOT NULL,
  role user_accounts_role_enum NOT NULL,
  "resetPasswordToken" VARCHAR NULL,
  "resetPasswordTokenExpiredAt" TIMESTAMPTZ NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_accounts_employee
    FOREIGN KEY ("employeeId")
    REFERENCES employees(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_user_accounts_applicant
    FOREIGN KEY ("applicantId")
    REFERENCES applicants(id)
    ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_user_accounts_email'
  ) THEN
    ALTER TABLE user_accounts ADD CONSTRAINT "UQ_user_accounts_email" UNIQUE (email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_user_accounts_employeeId'
  ) THEN
    ALTER TABLE user_accounts ADD CONSTRAINT "UQ_user_accounts_employeeId" UNIQUE ("employeeId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_user_accounts_applicantId'
  ) THEN
    ALTER TABLE user_accounts ADD CONSTRAINT "UQ_user_accounts_applicantId" UNIQUE ("applicantId");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userAccountId" UUID NOT NULL,
  "ipAddress" VARCHAR(45) NULL,
  "userAgent" VARCHAR(255) NULL,
  "isSuccess" BOOLEAN NOT NULL DEFAULT TRUE,
  "failureReason" TEXT NULL,
  "loggedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_login_history_user_account
    FOREIGN KEY ("userAccountId")
    REFERENCES user_accounts(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userAccountId" UUID NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NULL,
  metadata JSONB NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_activity_logs_user_account
    FOREIGN KEY ("userAccountId")
    REFERENCES user_accounts(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_vacancies_department_id ON vacancies("departmentId");
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_login_history_user_account_id ON login_history("userAccountId");
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_account_id ON activity_logs("userAccountId");

COMMIT;
