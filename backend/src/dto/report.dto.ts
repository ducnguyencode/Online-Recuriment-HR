import { ApplicationStatus } from 'src/common/enum';

export class ReportDto {
  totalApplications!: number;
  openVacancies!: number;
  hiringRate!: number;
  applicantsInProcess!: number;
  applicationStatusCount!: Partial<Record<ApplicationStatus, number>>;
  departmentBreakdown!: Record<
    string,
    { vacancies: number; applicants: number }
  >;
}
