import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/helper/date.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Between, Not, Repository } from 'typeorm';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { Application } from 'src/entities/application.entity';
import { ApplicationStatus } from 'src/common/enum';
import { Interview } from 'src/entities/interview.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Vacancy) private vacancyTable: Repository<Vacancy>,
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
    @InjectRepository(Interview) private interviewTable: Repository<Interview>,
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
}
