import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/helper/date.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Between, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { Application } from 'src/entities/application.entity';
import { ApplicationStatus } from 'src/common/enum';
import { Interview } from 'src/entities/interview.entity';
import { InterviewerPanel } from 'src/entities/interviewer-panel.entity';
import { Employee } from 'src/entities/employee.entity';

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
  ) {}

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
      where: { startTime: Between(today.start, today.end) },
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
    userId: string,
  ): Promise<{
    upcomingInterviews: number;
    passedVotes: number;
    failedVotes: number;
  }> {
    // Find the employee record for this user
    const employee = await this.employeeTable.findOne({
      where: { userId },
    });

    if (!employee) {
      return { upcomingInterviews: 0, passedVotes: 0, failedVotes: 0 };
    }

    const now = new Date();

    // Count upcoming interviews (scheduled, startTime >= now)
    const upcomingInterviews = await this.panelTable
      .createQueryBuilder('panel')
      .innerJoin('panel.interview', 'interview')
      .where('panel.employeeId = :empId', { empId: employee.id })
      .andWhere('interview.startTime >= :now', { now })
      .andWhere('interview.status = :status', { status: 'Scheduled' })
      .getCount();

    // Count passed votes
    const passedVotes = await this.panelTable.count({
      where: { employeeId: employee.id, vote: 'Pass' },
    });

    // Count failed votes
    const failedVotes = await this.panelTable.count({
      where: { employeeId: employee.id, vote: 'Fail' },
    });

    return { upcomingInterviews, passedVotes, failedVotes };
  }
}
