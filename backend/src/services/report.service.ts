/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApplicantStatus,
  ApplicationStatus,
  VacancyStatus,
} from 'src/common/enum';
import { ReportDto } from 'src/dto/report.dto';
import { Applicant } from 'src/entities/applicant.entity';
import { Application } from 'src/entities/application.entity';
import { Department } from 'src/entities/department.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
    @InjectRepository(Vacancy)
    private vacancyTable: Repository<Vacancy>,
    @InjectRepository(Applicant)
    private applicantTable: Repository<Applicant>,
    @InjectRepository(Department)
    private departmentTable: Repository<Department>,
  ) {}

  async recruitmentReport(): Promise<ReportDto> {
    const totalApplications = await this.applicationTable.count();
    const openVacancies = await this.vacancyTable.count({
      where: { status: VacancyStatus.OPENED },
    });
    const totalApplicationsSelected = await this.applicationTable.count({
      where: { status: ApplicationStatus.SELECTED },
    });
    const hiringRate =
      totalApplications == 0 || totalApplicationsSelected == 0
        ? 0
        : (totalApplicationsSelected / totalApplications) * 100;
    const applicantsInProcess = await this.applicantTable.count({
      where: { status: ApplicantStatus.IN_PROCESS },
    });

    const result = await this.applicationTable
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.status')
      .getRawMany();

    const applicationStatusCount = Object.fromEntries(
      Object.values(ApplicationStatus).map((status) => [
        status,
        Number(result.find((r) => r.status === status)?.count || 0),
      ]),
    ) as Record<ApplicationStatus, number>;

    return {
      totalApplications,
      openVacancies,
      hiringRate,
      applicantsInProcess,
      applicationStatusCount,
    };
  }
}
