-- Seed data for Online Recruitment project
-- Cẩn thận: TRUNCATE sẽ xóa dữ liệu hiện có trong các bảng ứng dụng.

BEGIN;

TRUNCATE TABLE
  activity_logs,
  login_history,
  applications,
  cvs,
  vacancies,
  employees,
  user_accounts,
  applicants,
  departments
RESTART IDENTITY CASCADE;

-- Password used for all test accounts: 123456
-- bcrypt hash (cost=10):
-- $2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu

-- ====== Departments ======
INSERT INTO departments (id, name, description, "isActive")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'HR Department', 'Human resources', true),
  ('22222222-2222-2222-2222-222222222222', 'Engineering Department', 'Hiring engineering roles', true),
  ('33333333-3333-3333-3333-333333333333', 'Marketing Department', 'Marketing and communications', true),
  ('44444444-4444-4444-4444-444444444444', 'Sales Department', 'Sales and business development', true),
  ('55555555-5555-5555-5555-555555555555', 'Finance Department', 'Finance and accounting', true),
  ('66666666-6666-6666-6666-666666666666', 'Design Department', 'Product and graphic design', true);

-- ====== Employees ======
INSERT INTO employees (id, "departmentId", "fullName", "email", "phone", "jobTitle", "isActive", "createdAt", "updatedAt")
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Nguyễn Huỳnh Đức', 'an.nguyen@abc.com', '0901000001', 'HR Staff', true, NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Lê Văn Cường', 'cuong.le@abc.com', '0901000002', 'Interviewer', true, NOW(), NOW()),
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', 'Trần Thị Bình', 'binh.tran@abc.com', '0901000003', 'HR Lead', true, NOW(), NOW()),
  ('13131313-1313-1313-1313-131313131313', '22222222-2222-2222-2222-222222222222', 'Phạm Minh Khoa', 'khoa.pham@abc.com', '0901000004', 'Senior Backend Engineer', true, NOW(), NOW()),
  ('14141414-1414-1414-1414-141414141414', '22222222-2222-2222-2222-222222222222', 'Đỗ Thu Hà', 'ha.do@abc.com', '0901000005', 'Frontend Tech Lead', true, NOW(), NOW()),
  ('15151515-1515-1515-1515-151515151515', '33333333-3333-3333-3333-333333333333', 'Ngô Gia Hưng', 'hung.ngo@abc.com', '0901000006', 'Marketing Specialist', true, NOW(), NOW()),
  ('16161616-1616-1616-1616-161616161616', '44444444-4444-4444-4444-444444444444', 'Võ Thanh Tùng', 'tung.vo@abc.com', '0901000007', 'Sales Manager', true, NOW(), NOW()),
  ('17171717-1717-1717-1717-171717171717', '66666666-6666-6666-6666-666666666666', 'Bùi Lan Anh', 'anh.bui@abc.com', '0901000008', 'Product Designer', true, NOW(), NOW());

-- ====== Applicants ======
INSERT INTO applicants (id, "fullName", "email", phone, status, "isActive", "createdAt")
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Nguyễn Thị Hoa', 'hoa.nguyen@gmail.com', '0900000000', 'OpenToWork', true, NOW() - INTERVAL '20 day'),
  ('18181818-1818-1818-1818-181818181818', 'Trần Minh Anh', 'minhanh.tran@gmail.com', '0900000001', 'OpenToWork', true, NOW() - INTERVAL '18 day'),
  ('19191919-1919-1919-1919-191919191919', 'Phạm Quốc Bảo', 'quocbao.pham@gmail.com', '0900000002', 'OpenToWork', true, NOW() - INTERVAL '16 day'),
  ('20212121-2021-2021-2021-202121212121', 'Lý Thu Trang', 'trang.ly@gmail.com', '0900000003', 'OpenToWork', true, NOW() - INTERVAL '14 day'),
  ('21212121-2121-2121-2121-212121212121', 'Đặng Nhật Nam', 'nhatnam.dang@gmail.com', '0900000004', 'Hired', true, NOW() - INTERVAL '12 day'),
  ('22212121-2221-2221-2221-222121212121', 'Hoàng Gia Linh', 'gialinh.hoang@gmail.com', '0900000005', 'OpenToWork', true, NOW() - INTERVAL '11 day'),
  ('23232323-2323-2323-2323-232323232323', 'Vũ Ngọc Mai', 'ngocmai.vu@gmail.com', '0900000006', 'Banned', true, NOW() - INTERVAL '9 day'),
  ('24242424-2424-2424-2424-242424242424', 'Lâm Đức Huy', 'duchuy.lam@gmail.com', '0900000007', 'OpenToWork', true, NOW() - INTERVAL '7 day'),
  ('25252525-2525-2525-2525-252525252525', 'Tạ Mỹ Duyên', 'myduyen.ta@gmail.com', '0900000008', 'OpenToWork', true, NOW() - INTERVAL '5 day'),
  ('26262626-2626-2626-2626-262626262626', 'Phan Hoài Thương', 'hoaithuong.phan@gmail.com', '0900000009', 'OpenToWork', true, NOW() - INTERVAL '3 day');

-- ====== User Accounts (JWT login) ======
INSERT INTO user_accounts (
  id,
  "employeeId",
  "applicantId",
  email,
  "passwordHash",
  role,
  "resetPasswordToken",
  "resetPasswordTokenExpiredAt",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES
  ('10101010-1010-1010-1010-101010101010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'an.nguyen@abc.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'HR', NULL, NULL, true, NOW(), NOW()),
  ('20202020-2020-2020-2020-202020202020', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'cuong.le@abc.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Interviewer', NULL, NULL, true, NOW(), NOW()),
  ('30303030-3030-3030-3030-303030303030', NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'hoa.nguyen@gmail.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Applicant', NULL, NULL, true, NOW(), NOW()),
  ('40404040-4040-4040-4040-404040404040', '12121212-1212-1212-1212-121212121212', NULL, 'binh.tran@abc.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'HR', NULL, NULL, true, NOW(), NOW()),
  ('50505050-5050-5050-5050-505050505050', '13131313-1313-1313-1313-131313131313', NULL, 'khoa.pham@abc.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Interviewer', NULL, NULL, true, NOW(), NOW()),
  ('60606060-6060-6060-6060-606060606060', '14141414-1414-1414-1414-141414141414', NULL, 'ha.do@abc.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Interviewer', NULL, NULL, true, NOW(), NOW()),
  ('70707070-7070-7070-7070-707070707070', NULL, '18181818-1818-1818-1818-181818181818', 'minhanh.tran@gmail.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Applicant', NULL, NULL, true, NOW(), NOW()),
  ('80808080-8080-8080-8080-808080808080', NULL, '19191919-1919-1919-1919-191919191919', 'quocbao.pham@gmail.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Applicant', NULL, NULL, true, NOW(), NOW()),
  ('90909090-9090-9090-9090-909090909090', NULL, '20212121-2021-2021-2021-202121212121', 'trang.ly@gmail.com', '$2b$10$Wtoobjj.1ZEZ.AwsPijhGeD1Y1a4B6/XFPP0xPzYA4N.7n0xdlnpu', 'Applicant', NULL, NULL, true, NOW(), NOW());

-- ====== Vacancies ======
INSERT INTO vacancies (
  id,
  "departmentId",
  title,
  description,
  "numberOfOpenings",
  "currentHiredCount",
  status,
  "closingDate",
  "createdAt"
)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Backend Engineer', 'Build and maintain backend services', 2, 0, 'Opened', (CURRENT_DATE + INTERVAL '30 day')::date, NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'HR Intern', 'Support HR department operations', 1, 0, 'Opened', (CURRENT_DATE + INTERVAL '15 day')::date, NOW()),
  ('abababab-abab-abab-abab-abababababab', '22222222-2222-2222-2222-222222222222', 'Frontend Engineer', 'Build Angular interfaces and shared components', 2, 0, 'Opened', (CURRENT_DATE + INTERVAL '25 day')::date, NOW()),
  ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', '22222222-2222-2222-2222-222222222222', 'QA Engineer', 'Write test plans and automate regression scenarios', 1, 0, 'Opened', (CURRENT_DATE + INTERVAL '20 day')::date, NOW()),
  ('efefefef-efef-efef-efef-efefefefefef', '33333333-3333-3333-3333-333333333333', 'Content Marketing Specialist', 'Develop social and content strategies', 1, 0, 'Opened', (CURRENT_DATE + INTERVAL '10 day')::date, NOW()),
  ('11112222-3333-4444-5555-666677778888', '44444444-4444-4444-4444-444444444444', 'Sales Executive', 'Grow strategic customer pipeline', 3, 1, 'Opened', (CURRENT_DATE + INTERVAL '35 day')::date, NOW()),
  ('99998888-7777-6666-5555-444433332222', '66666666-6666-6666-6666-666666666666', 'UI/UX Designer', 'Design flows, mockups, and design systems', 1, 0, 'Closed', (CURRENT_DATE - INTERVAL '2 day')::date, NOW()),
  ('12341234-5678-90ab-cdef-1234567890ab', '55555555-5555-5555-5555-555555555555', 'Finance Analyst', 'Support finance planning and reporting', 1, 0, 'Opened', (CURRENT_DATE + INTERVAL '18 day')::date, NOW());

-- ====== CVs ======
INSERT INTO cvs (id, "applicantId", "fileUrl", "parsedDataAi", "createdAt")
VALUES
  (
    'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'hoa_nguyen_cv.pdf',
    '{"fullName":"Nguyễn Thị Hoa","email":"hoa.nguyen@gmail.com","phone":"0900000000","skills":["Angular","Figma","Communication"],"experience":"1 year internship experience","education":"HCMUS"}',
    NOW() - INTERVAL '19 day'
  ),
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    '18181818-1818-1818-1818-181818181818',
    'tran_minh_anh_cv.pdf',
    '{"fullName":"Trần Minh Anh","email":"minhanh.tran@gmail.com","phone":"0900000001","skills":["Node.js","PostgreSQL","Docker"],"experience":"2 years backend experience","education":"UIT"}',
    NOW() - INTERVAL '17 day'
  ),
  (
    'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    '19191919-1919-1919-1919-191919191919',
    'pham_quoc_bao_cv.pdf',
    '{"fullName":"Phạm Quốc Bảo","email":"quocbao.pham@gmail.com","phone":"0900000002","skills":["Java","Spring Boot","SQL"],"experience":"3 years software engineering","education":"BKU"}',
    NOW() - INTERVAL '15 day'
  ),
  (
    'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3',
    '20212121-2021-2021-2021-202121212121',
    'ly_thu_trang_cv.pdf',
    '{"fullName":"Lý Thu Trang","email":"trang.ly@gmail.com","phone":"0900000003","skills":["Recruitment","Interview coordination","Excel"],"experience":"1.5 years HR operations","education":"UEH"}',
    NOW() - INTERVAL '13 day'
  ),
  (
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    '21212121-2121-2121-2121-212121212121',
    'dang_nhat_nam_cv.pdf',
    '{"fullName":"Đặng Nhật Nam","email":"nhatnam.dang@gmail.com","phone":"0900000004","skills":["React","TypeScript","Testing"],"experience":"4 years frontend experience","education":"PTIT"}',
    NOW() - INTERVAL '11 day'
  ),
  (
    'f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5',
    '22212121-2221-2221-2221-222121212121',
    'hoang_gia_linh_cv.pdf',
    '{"fullName":"Hoàng Gia Linh","email":"gialinh.hoang@gmail.com","phone":"0900000005","skills":["SEO","Content writing","Canva"],"experience":"2 years marketing execution","education":"HCMOU"}',
    NOW() - INTERVAL '10 day'
  ),
  (
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    '24242424-2424-2424-2424-242424242424',
    'lam_duc_huy_cv.pdf',
    '{"fullName":"Lâm Đức Huy","email":"duchuy.lam@gmail.com","phone":"0900000007","skills":["Figma","UI Design","Prototype"],"experience":"2 years product design","education":"VLU"}',
    NOW() - INTERVAL '6 day'
  ),
  (
    'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7',
    '25252525-2525-2525-2525-252525252525',
    'ta_my_duyen_cv.pdf',
    '{"fullName":"Tạ Mỹ Duyên","email":"myduyen.ta@gmail.com","phone":"0900000008","skills":["Accounting","Power BI","Financial reporting"],"experience":"2 years finance analyst","education":"UEL"}',
    NOW() - INTERVAL '4 day'
  );

-- ====== Applications ======
INSERT INTO applications (
  id,
  "applicantId",
  "vacancyId",
  "cvId",
  status,
  "aiPrivew",
  "hrNotes",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
    'Applied',
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '01010101-1111-2222-3333-444444444444',
    '18181818-1818-1818-1818-181818181818',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    'Screening',
    '{"cvData":{"skills":["Node.js","PostgreSQL","Docker"]},"matchScore":"88","sumaryAnalysis":"Strong backend profile"}',
    'Strong backend fundamentals. Move to technical screening.',
    NOW() - INTERVAL '16 day',
    NOW() - INTERVAL '14 day'
  ),
  (
    '02020202-1111-2222-3333-444444444444',
    '19191919-1919-1919-1919-191919191919',
    'abababab-abab-abab-abab-abababababab',
    'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    'Applied',
    '{"cvData":{"skills":["Java","Spring Boot","SQL"]},"matchScore":"79","sumaryAnalysis":"Transferable engineering experience"}',
    'Could fit frontend after ramp-up, keep in review.',
    NOW() - INTERVAL '15 day',
    NOW() - INTERVAL '15 day'
  ),
  (
    '03030303-1111-2222-3333-444444444444',
    '20212121-2021-2021-2021-202121212121',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3',
    'Interviewing',
    '{"cvData":{"skills":["Recruitment","Interview coordination","Excel"]},"matchScore":"91","sumaryAnalysis":"Strong HR support background"}',
    'Good communication and HR coordination.',
    NOW() - INTERVAL '12 day',
    NOW() - INTERVAL '5 day'
  ),
  (
    '04040404-1111-2222-3333-444444444444',
    '21212121-2121-2121-2121-212121212121',
    'abababab-abab-abab-abab-abababababab',
    'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4',
    'Hired',
    '{"cvData":{"skills":["React","TypeScript","Testing"]},"matchScore":"95","sumaryAnalysis":"Excellent frontend fit"}',
    'Accepted offer.',
    NOW() - INTERVAL '10 day',
    NOW() - INTERVAL '2 day'
  ),
  (
    '05050505-1111-2222-3333-444444444444',
    '22212121-2221-2221-2221-222121212121',
    'efefefef-efef-efef-efef-efefefefefef',
    'f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5',
    'Screening',
    '{"cvData":{"skills":["SEO","Content writing","Canva"]},"matchScore":"84","sumaryAnalysis":"Good marketing profile"}',
    'Suitable for content role.',
    NOW() - INTERVAL '9 day',
    NOW() - INTERVAL '6 day'
  ),
  (
    '06060606-1111-2222-3333-444444444444',
    '24242424-2424-2424-2424-242424242424',
    '99998888-7777-6666-5555-444433332222',
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    'Rejected',
    '{"cvData":{"skills":["Figma","UI Design","Prototype"]},"matchScore":"82","sumaryAnalysis":"Solid designer but role was closed"}',
    'Role already closed.',
    NOW() - INTERVAL '6 day',
    NOW() - INTERVAL '3 day'
  ),
  (
    '07070707-1111-2222-3333-444444444444',
    '25252525-2525-2525-2525-252525252525',
    '12341234-5678-90ab-cdef-1234567890ab',
    'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7',
    'Interviewing',
    '{"cvData":{"skills":["Accounting","Power BI","Financial reporting"]},"matchScore":"89","sumaryAnalysis":"Strong finance candidate"}',
    'Schedule finance panel interview.',
    NOW() - INTERVAL '4 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '08080808-1111-2222-3333-444444444444',
    '26262626-2626-2626-2626-262626262626',
    '11112222-3333-4444-5555-666677778888',
    'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
    'Applied',
    '{"cvData":{"skills":["Communication","Customer support"]},"matchScore":"70","sumaryAnalysis":"Potential sales trainee"}',
    'Need more details on sales experience.',
    NOW() - INTERVAL '2 day',
    NOW() - INTERVAL '2 day'
  );

-- ====== Login History ======
INSERT INTO login_history (
  id,
  "userAccountId",
  "ipAddress",
  "userAgent",
  "isSuccess",
  "failureReason",
  "loggedAt"
)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '10101010-1010-1010-1010-101010101010', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '5 day'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '20202020-2020-2020-2020-202020202020', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '4 day'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '30303030-3030-3030-3030-303030303030', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '3 day'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '40404040-4040-4040-4040-404040404040', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '2 day'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '50505050-5050-5050-5050-505050505050', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '2 day'),
  ('aaaaaaaa-0000-0000-0000-000000000006', '60606060-6060-6060-6060-606060606060', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '70707070-7070-7070-7070-707070707070', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000008', '80808080-8080-8080-8080-808080808080', '127.0.0.1', 'seed', false, 'Invalid password', NOW() - INTERVAL '12 hour'),
  ('aaaaaaaa-0000-0000-0000-000000000009', '90909090-9090-9090-9090-909090909090', '127.0.0.1', 'seed', true, NULL, NOW() - INTERVAL '6 hour');

-- ====== Activity Logs ======
INSERT INTO activity_logs (
  id,
  "userAccountId",
  action,
  description,
  metadata,
  "createdAt"
)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '10101010-1010-1010-1010-101010101010', 'LOGIN', 'Seeded login history for HR account', NULL, NOW() - INTERVAL '5 day'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '20202020-2020-2020-2020-202020202020', 'LOGIN', 'Seeded login history for interviewer account', NULL, NOW() - INTERVAL '4 day'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '30303030-3030-3030-3030-303030303030', 'LOGIN', 'Seeded login history for applicant account', NULL, NOW() - INTERVAL '3 day'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '10101010-1010-1010-1010-101010101010', 'CREATE_VACANCY', 'Created Backend Engineer vacancy', '{"vacancyId":"dddddddd-dddd-dddd-dddd-dddddddddddd"}', NOW() - INTERVAL '20 day'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '40404040-4040-4040-4040-404040404040', 'CREATE_VACANCY', 'Created HR Intern vacancy', '{"vacancyId":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"}', NOW() - INTERVAL '16 day'),
  ('bbbbbbbb-0000-0000-0000-000000000006', '10101010-1010-1010-1010-101010101010', 'CREATE_APPLICATION', 'Applicant attached to Backend Engineer', '{"applicationId":"ffffffff-ffff-ffff-ffff-ffffffffffff"}', NOW() - INTERVAL '19 day'),
  ('bbbbbbbb-0000-0000-0000-000000000007', '40404040-4040-4040-4040-404040404040', 'CHANGE_APPLICATION_STATUS', 'Moved candidate to interview stage', '{"applicationId":"03030303-1111-2222-3333-444444444444","status":"Interviewing"}', NOW() - INTERVAL '5 day'),
  ('bbbbbbbb-0000-0000-0000-000000000008', '10101010-1010-1010-1010-101010101010', 'CLOSE_VACANCY', 'Closed UI/UX Designer role', '{"vacancyId":"99998888-7777-6666-5555-444433332222"}', NOW() - INTERVAL '2 day'),
  ('bbbbbbbb-0000-0000-0000-000000000009', '50505050-5050-5050-5050-505050505050', 'REVIEW_CV', 'Reviewed backend candidate CV', '{"cvId":"f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1"}', NOW() - INTERVAL '14 day'),
  ('bbbbbbbb-0000-0000-0000-000000000010', '60606060-6060-6060-6060-606060606060', 'REVIEW_CV', 'Reviewed frontend candidate CV', '{"cvId":"f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4"}', NOW() - INTERVAL '3 day'),
  ('bbbbbbbb-0000-0000-0000-000000000011', '70707070-7070-7070-7070-707070707070', 'LOGIN', 'Applicant signed in to check application', NULL, NOW() - INTERVAL '1 day'),
  ('bbbbbbbb-0000-0000-0000-000000000012', '90909090-9090-9090-9090-909090909090', 'REGISTER_APPLICANT', 'Applicant account created from seed data', NULL, NOW() - INTERVAL '3 day');

COMMIT;

