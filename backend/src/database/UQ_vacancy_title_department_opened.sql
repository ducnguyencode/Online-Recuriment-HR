CREATE UNIQUE INDEX "UQ_vacancy_title_department_opened"
ON vacancies (title, "departmentId")
WHERE status = 'Opened';