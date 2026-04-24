import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationStatus, VacancyStatus } from 'src/common/enum';
import { ReportDto } from 'src/dto/report.dto';
import { Application } from 'src/entities/application.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
    @InjectRepository(Vacancy)
    private vacancyTable: Repository<Vacancy>,
  ) {}

  async recruitmentReport(): Promise<ReportDto> {
    const totalApplications = await this.applicationTable.count();
    const openVacancies = await this.vacancyTable.count({
      where: { status: VacancyStatus.OPENED },
    });
    const totalApplicationsSelected = await this.applicationTable.count({
      where: { status: ApplicationStatus.SELECTED },
    });

    const hiringRate = 0;
    const applicantsInProcess = 0;
    return {
      totalApplications,
      openVacancies,
    };
  }
}
