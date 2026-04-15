import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { Brackets, Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { Applicant } from 'src/entities/applicant.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { CV } from 'src/entities/cv.entity';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { FindResponseDto } from 'src/helper/find.response.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    private aiService: AiService,
  ) {}

  async findAll(
    request: ApplicationFindDto,
  ): Promise<FindResponseDto<Application>> {
    const { page, limit, search, vacancyId, applicantId, status } = request;

    const qb = this.applicationsTable.createQueryBuilder('application');

    qb.leftJoinAndSelect('application.vacancy', 'vacancy');
    qb.leftJoinAndSelect('application.applicant', 'applicant');
    qb.leftJoinAndSelect('application.cv', 'cv');

    //Filter
    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('application.vacancy.title ILIKE :search').orWhere(
            'application.applicant.fullName ILIKE :search',
          );
        }),
        { search: search },
      );
    }

    if (status) {
      qb.andWhere('application.status = :status', { status: status });
    }

    if (vacancyId) {
      qb.andWhere('application.vacancyId = :vId', { vId: vacancyId });
    }

    if (applicantId) {
      qb.andWhere('application.applicantId = :aId', { aId: applicantId });
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    qb.orderBy('application.createdAt', 'DESC');

    const [applications, totalApplication] = await qb.getManyAndCount();

    return {
      items: applications,
      totalItems: totalApplication,
      totalPage: Math.ceil(totalApplication / limit),
    };
  }

  async findById(id: number): Promise<Application> {
    return await this.applicationsTable.findOneOrFail({
      where: { id },
      relations: { applicant: true, vacancy: true, cv: true },
    });
  }

  async create(data: ApplicationCreateDto) {
    return this.applicationsTable.manager.transaction(async (manager) => {
      const applicant = await manager.findOne(Applicant, {
        where: { id: data.applicantId },
      });

      if (!applicant) {
        throw new NotFoundException('Applicant not found');
      }
      const vacancy = await manager.findOne(Vacancy, {
        where: { id: data.vacancyId },
      });

      if (!vacancy) {
        throw new NotFoundException('Vacancy not found');
      }

      const cv = await manager.findOne(CV, { where: { id: data.cvId } });

      let application = manager.create(Application, {
        ...data,
        applicant,
        vacancy,
        cv,
      });

      application = await manager.save(application);

      application.code = `A${application.id.toString().padStart(4, '0')}`;

      if (application.cv) {
        // AI preview
        try {
          const aiResponse = await this.aiService.reviewCv(application);
          if (aiResponse) {
            application.aiPreview = aiResponse;
          }
        } catch (err) {
          console.log(err);
        }
      }
      return manager.save(application);
    });
  }

  async changeStatus(id: number, status: ApplicationStatus) {
    const application = await this.findById(id);
    application.status = status;
    return this.applicationsTable.save(application);
  }
}
