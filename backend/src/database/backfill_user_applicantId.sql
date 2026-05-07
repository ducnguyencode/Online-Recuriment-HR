-- Backfill users.applicantId for existing applicant accounts whose
-- applicant row was created before user.service.verifyAccount was fixed
-- to set user.applicantId. Safe to re-run (idempotent).
UPDATE users u
SET "applicantId" = a.id
FROM applicants a
WHERE a."userId" = u.id
  AND u."applicantId" IS NULL;
