BEGIN;

-- Password for all seeded users: 123456
-- bcrypt hash generated once for portability
-- (app can still force password change by policy if needed)

INSERT INTO departments (id, name, description, "isActive")
VALUES
  (1, 'Engineering', NULL, TRUE),
  (2, 'Marketing', NULL, TRUE),
  (3, 'Sales', NULL, TRUE),
  (4, 'HR', NULL, TRUE),
  (5, 'Finance', NULL, TRUE),
  (6, 'Design', NULL, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (
  id, email, password, role, "fullName", phone,
  "isVerified", "isActive", "mustChangePassword",
  roles, "verificationToken", "invitedUserExpiresAt", "verifiedAt",
  "resetPasswordToken", "resetPasswordTokenExpiresAt",
  "applicantId", "employeeId"
)
VALUES
  (1, 'admin@test.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Super Admin', 'Super Admin', '0901234567', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (2, 'hr@test.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'HR', 'HR', '0901234567', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (3, 'interviewer@test.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Interviewer', 'Interviewer', '0901234567', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (4, 'applicant@test.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Applicant', 'Applicant', '0901234567', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (5, 'interviewer2@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Interviewer', 'Interviewer 2', '0901234567', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (6, 'hr2@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'HR', 'HR 2', '0912345678', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (7, 'manh.bui@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Interviewer', 'Bui Duc Manh', '0923456789', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (8, 'hoa.nguyen@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Applicant', 'Nguyen Thi Hoa', '0934567890', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (9, 'khoa.dang@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Applicant', 'Dang Van Khoa', '0945678901', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (10, 'mai.ly@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Applicant', 'Ly Thi Mai', '0956789012', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (11, 'nam.tran@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Applicant', 'Tran Van Nam', '0967890123', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL),
  (12, 'oanh.phan@gmail.com', '$2b$10$hzL9qOv39fzbdKVH.FNuje9.sC9T7Wpub3j1Y4fZmEzO2QkY/gLyS', 'Interviewer', 'Phan Thi Oanh', '0978901234', TRUE, TRUE, FALSE, NULL, NULL, NULL, NOW(), NULL, NULL, NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO applicants ("userId", status)
SELECT u.id, 'Not In Process'
FROM users u
WHERE u.role = 'Applicant'
  AND NOT EXISTS (
    SELECT 1 FROM applicants a WHERE a."userId" = u.id
  );

INSERT INTO employees ("userId", "departmentId", "jobTitle", "isActive")
SELECT
  u.id,
  CASE
    WHEN u.id = 2 THEN 4
    WHEN u.id = 3 THEN 1
    WHEN u.id = 5 THEN 2
    WHEN u.id = 6 THEN 4
    WHEN u.id = 7 THEN 1
    WHEN u.id = 12 THEN 6
    ELSE 1
  END AS "departmentId",
  NULL AS "jobTitle",
  TRUE AS "isActive"
FROM users u
WHERE u.role IN ('HR', 'Interviewer')
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e."userId" = u.id
  );

UPDATE users u
SET "applicantId" = a.id
FROM applicants a
WHERE a."userId" = u.id
  AND u.role = 'Applicant'
  AND (u."applicantId" IS DISTINCT FROM a.id);

UPDATE users u
SET "employeeId" = e.id
FROM employees e
WHERE e."userId" = u.id
  AND u.role IN ('HR', 'Interviewer')
  AND (u."employeeId" IS DISTINCT FROM e.id);

INSERT INTO vacancies (
  id, "departmentId", "createdById", title, description,
  "numberOfOpenings", "filledCount", status, "closingDate"
)
VALUES
  (1, 1, 1, 'Senior Frontend Developer', 'React/TypeScript expert with 3+ years. Strong knowledge of State Management, Testing and CI/CD.', 2, 0, 'Opened', CURRENT_DATE + INTERVAL '10 day'),
  (2, 2, 1, 'Marketing Manager', 'Manage online/offline marketing strategy. 5+ years, proficient in Google Ads, Facebook Ads and SEO.', 1, 0, 'Opened', CURRENT_DATE + INTERVAL '9 day'),
  (3, 3, 2, 'Sales Executive', 'B2B sales, strong negotiation and presentation skills. IT industry experience preferred.', 3, 1, 'Opened', CURRENT_DATE + INTERVAL '8 day'),
  (4, 6, 2, 'UX Designer', 'User experience design, proficient in Figma, with real portfolio.', 1, 1, 'Closed', CURRENT_DATE + INTERVAL '7 day'),
  (5, 5, 1, 'Finance Analyst', 'Financial analysis, reporting, forecasting. CFA Level 1+ is a plus.', 2, 0, 'Suspended', CURRENT_DATE + INTERVAL '6 day'),
  (6, 1, 2, 'Backend Engineer', 'API development, microservices. Node.js/NestJS, PostgreSQL, Docker required.', 2, 0, 'Opened', CURRENT_DATE + INTERVAL '5 day'),
  (7, 4, 1, 'HR Business Partner', 'HR strategy consulting, support departments in recruitment and people development.', 1, 0, 'Opened', CURRENT_DATE + INTERVAL '4 day'),
  (8, 1, 2, 'DevOps Engineer', 'Cloud infrastructure (AWS/GCP), CI/CD pipelines, monitoring. Kubernetes experience is a plus.', 1, 0, 'Opened', CURRENT_DATE + INTERVAL '3 day')
ON CONFLICT ("title", "departmentId") DO NOTHING;

SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1), TRUE);
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), TRUE);
SELECT setval(pg_get_serial_sequence('applicants', 'id'), COALESCE((SELECT MAX(id) FROM applicants), 1), TRUE);
SELECT setval(pg_get_serial_sequence('employees', 'id'), COALESCE((SELECT MAX(id) FROM employees), 1), TRUE);
SELECT setval(pg_get_serial_sequence('vacancies', 'id'), COALESCE((SELECT MAX(id) FROM vacancies), 1), TRUE);

COMMIT;
