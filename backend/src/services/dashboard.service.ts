import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/helper/date.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Between, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { Application } from 'src/entities/application.entity';
import {
  ApplicationStatus,
  InterviewStatus,
  VacancyStatus,
} from 'src/common/enum';
import { Interview } from 'src/entities/interview.entity';
import { InterviewerPanel } from 'src/entities/interviewer-panel.entity';
import { Employee } from 'src/entities/employee.entity';
import { User } from 'src/entities/user.entity';
import { Department } from 'src/entities/department.entity';

export interface RecruitmentReportDto {
  totals: {
    totalApplications: number;
    openVacancies: number;
    hiringRate: number;
    applicantsInProcess: number;
  };
  pipeline: { label: string; status: string; count: number }[];
  departments: {
    name: string;
    code: string;
    vacancies: number;
    applications: number;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Vacancy) private vacancyTable: Repository<Vacancy>,
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
    @InjectRepository(Interview) private interviewTable: Repository<Interview>,
    @InjectRepository(InterviewerPanel)
    private panelTable: Repository<InterviewerPanel>,
    @InjectRepository(Employee)
    private employeeTable: Repository<Employee>,
    @InjectRepository(User)
    private userTable: Repository<User>,
    @InjectRepository(Department)
    private departmentTable: Repository<Department>,
  ) {}

  async systemOverview(): Promise<{
    users: number;
    vacancies: number;
    applications: number;
    interviews: number;
  }> {
    const [users, vacancies, applications, interviews] = await Promise.all([
      this.userTable.count(),
      this.vacancyTable.count(),
      this.applicationTable.count(),
      this.interviewTable.count(),
    ]);

    return {
      users,
      vacancies,
      applications,
      interviews,
    };
  }

  async activityOverview(): Promise<OverviewDto> {
    const today = DateUtil.todayUTC();
    const thisMonth = DateUtil.monthRangeUTC(0);
    const lastMonth = DateUtil.monthRangeUTC(-1);
    const vacanciesThisMonth = await this.vacancyTable.count({
      where: { createdAt: Between(thisMonth.start, thisMonth.end) },
    });
    const vacanciesLastMonth = await this.vacancyTable.count({
      where: { createdAt: Between(lastMonth.start, lastMonth.end) },
    });

    const applicationsProcessingThisMonth = await this.applicationTable.count({
      where: {
        createdAt: Between(thisMonth.start, thisMonth.end),
        status: Not(ApplicationStatus.PENDING),
      },
    });

    const applicationsProcessingLastMonth = await this.applicationTable.count({
      where: {
        updatedAt: Between(lastMonth.start, lastMonth.end),
        status: Not(ApplicationStatus.PENDING),
      },
    });

    const interviewToday = await this.interviewTable.count({
      where: {
        startTime: Between(today.start, today.end),
        status: InterviewStatus.SCHEDULED,
      },
    });

    const applicationsThisMonth = await this.applicationTable.count({
      where: { createdAt: Between(thisMonth.start, thisMonth.end) },
    });

    const applicantsHiredThisMonth = await this.applicationTable.count({
      where: {
        updatedAt: Between(thisMonth.start, thisMonth.end),
        status: ApplicationStatus.SELECTED,
      },
    });

    const applicantsHiredLastMonth = await this.applicationTable.count({
      where: {
        updatedAt: Between(lastMonth.start, lastMonth.end),
        status: ApplicationStatus.SELECTED,
      },
    });

    return {
      vacanciesLastMonth,
      vacanciesThisMonth,
      applicationsProcessingLastMonth,
      applicationsProcessingThisMonth,
      interviewToday,
      applicationsThisMonth,
      applicantsHiredThisMonth,
      applicantsHiredLastMonth,
    };
  }

  async interviewerOverview(
    userId: string | number,
    employeeId?: string | number | null,
  ): Promise<{
    upcomingInterviews: number;
    passedVotes: number;
    failedVotes: number;
    upcomingInterviewItems: Interview[];
  }> {
    let empId = employeeId ? String(employeeId) : '';

    if (!empId) {
      const employee = await this.employeeTable.findOne({
        where: { user: { id: Number(userId) } },
      });
      empId = employee?.id ? String(employee.id) : '';
    }

    if (!empId) {
      return {
        upcomingInterviews: 0,
        passedVotes: 0,
        failedVotes: 0,
        upcomingInterviewItems: [],
      };
    }

    const now = new Date();

    const upcomingInterviewItems = await this.interviewTable
      .createQueryBuilder('interview')
      .innerJoin('interview.panels', 'ownPanel')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('applicant.user', 'applicantUser')
      .leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('interview.panels', 'panels')
      .leftJoinAndSelect('panels.employee', 'panelEmployee')
      .leftJoinAndSelect('panelEmployee.user', 'panelUser')
      .where('ownPanel.employeeId = :empId', { empId })
      .andWhere('interview.startTime >= :now', { now })
      .andWhere('interview.status = :status', {
        status: InterviewStatus.SCHEDULED,
      })
      .orderBy('interview.startTime', 'ASC')
      .getMany();

    // Count passed votes
    const passedVotes = await this.panelTable.count({
      where: { employeeId: empId, vote: 'Pass' },
    });

    // Count failed votes
    const failedVotes = await this.panelTable.count({
      where: { employeeId: empId, vote: 'Fail' },
    });

    return {
      upcomingInterviews: upcomingInterviewItems.length,
      passedVotes,
      failedVotes,
      upcomingInterviewItems,
    };
  }

  async recruitmentReports(): Promise<RecruitmentReportDto> {
    const [
      totalApplications,
      openVacancies,
      hiredCount,
      pipelineRaw,
      departments,
      vacancyByDept,
      applicationsByDept,
    ] = await Promise.all([
      this.applicationTable.count(),
      this.vacancyTable.count({ where: { status: VacancyStatus.OPENED } }),
      this.applicationTable.count({
        where: { status: ApplicationStatus.SELECTED },
      }),
      this.applicationTable
        .createQueryBuilder('app')
        .select('app.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('app.status')
        .getRawMany<{ status: string; count: string }>(),
      this.departmentTable.find({ order: { name: 'ASC' } }),
      this.vacancyTable
        .createQueryBuilder('v')
        .select('v.departmentId', 'departmentId')
        .addSelect('COUNT(*)', 'count')
        .where('v.status = :status', { status: VacancyStatus.OPENED })
        .groupBy('v.departmentId')
        .getRawMany<{ departmentId: number; count: string }>(),
      this.applicationTable
        .createQueryBuilder('app')
        .leftJoin('app.vacancy', 'v')
        .select('v.departmentId', 'departmentId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('v.departmentId')
        .getRawMany<{ departmentId: number; count: string }>(),
    ]);

    const pipelineMap = new Map(
      pipelineRaw.map((row) => [row.status, Number(row.count)]),
    );
    const inProcessStatuses = [
      ApplicationStatus.PENDING,
      ApplicationStatus.PENDING_REVIEW,
      ApplicationStatus.INTERVIEW_SCHEDULED,
    ];
    const applicantsInProcess = inProcessStatuses.reduce(
      (sum, s) => sum + (pipelineMap.get(s) ?? 0),
      0,
    );

    const pipeline = [
      {
        label: 'Pending',
        status: ApplicationStatus.PENDING,
        count: pipelineMap.get(ApplicationStatus.PENDING) ?? 0,
      },
      {
        label: 'Interviewing',
        status: ApplicationStatus.INTERVIEW_SCHEDULED,
        count: pipelineMap.get(ApplicationStatus.INTERVIEW_SCHEDULED) ?? 0,
      },
      {
        label: 'Pending Review',
        status: ApplicationStatus.PENDING_REVIEW,
        count: pipelineMap.get(ApplicationStatus.PENDING_REVIEW) ?? 0,
      },
      {
        label: 'Selected',
        status: ApplicationStatus.SELECTED,
        count: pipelineMap.get(ApplicationStatus.SELECTED) ?? 0,
      },
      {
        label: 'Rejected',
        status: ApplicationStatus.REJECTED,
        count: pipelineMap.get(ApplicationStatus.REJECTED) ?? 0,
      },
    ];

    const vacByDeptMap = new Map(
      vacancyByDept.map((r) => [Number(r.departmentId), Number(r.count)]),
    );
    const appByDeptMap = new Map(
      applicationsByDept.map((r) => [Number(r.departmentId), Number(r.count)]),
    );

    const deptRows = departments
      .map((d) => ({
        name: d.name,
        code: d.code,
        vacancies: vacByDeptMap.get(d.id) ?? 0,
        applications: appByDeptMap.get(d.id) ?? 0,
      }))
      .filter((d) => d.vacancies > 0 || d.applications > 0);

    const hiringRate =
      totalApplications > 0
        ? Math.round((hiredCount / totalApplications) * 1000) / 10
        : 0;

    return {
      totals: {
        totalApplications,
        openVacancies,
        hiringRate,
        applicantsInProcess,
      },
      pipeline,
      departments: deptRows,
    };
  }
}
