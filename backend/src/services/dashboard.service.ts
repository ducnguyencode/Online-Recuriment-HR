import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/helper/date.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Between, Not, Repository } from 'typeorm';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { Application } from 'src/entities/application.entity';
import { ApplicationStatus } from 'src/common/enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Vacancy) private vacancyTable: Repository<Vacancy>,
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
  ) {}

  async vacancyOverview(): Promise<OverviewDto> {
    const thisMonth = DateUtil.monthRangeUTC(0);
    const lastMonth = DateUtil.monthRangeUTC(-1);
    const vacanciesThisMonth = await this.vacancyTable.count({
      where: { createdAt: Between(thisMonth.start, thisMonth.end) },
    });
    const vacanciesLastMonth = await this.vacancyTable.count({
      where: { createdAt: Between(lastMonth.start, lastMonth.end) },
    });

    const applicationProcessingThisMonth = await this.applicationTable.count({
      where: {
        createdAt: Between(thisMonth.start, thisMonth.end),
        status: Not(ApplicationStatus.PENDING),
      },
    });
    const applicationProcessingLastMonth = await this.applicationTable.count({
      where: {
        createdAt: Between(lastMonth.start, lastMonth.end),
        status: Not(ApplicationStatus.PENDING),
      },
    });

    return {
      vacanciesLastMonth,
      vacanciesThisMonth,
      applicationProcessingLastMonth,
      applicationProcessingThisMonth,
    };
  }
}
