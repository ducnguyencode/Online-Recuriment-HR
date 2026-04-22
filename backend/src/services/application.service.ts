/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { Brackets, Repository } from 'typeorm';
import { AiService } from './ai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Applicant } from 'src/entities/applicant.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { CV } from 'src/entities/cv.entity';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { CustomValidator } from 'src/common/validator/custom.validator';
import { ApplicantService } from './applicant.service';
import { ApplicantStatus, ApplicationStatus } from 'src/common/enum';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    private aiService: AiService,
    private customValidator: CustomValidator,
    private applicantService: ApplicantService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    request: ApplicationFindDto,
  ): Promise<FindResponseDto<Application>> {
    const { page, limit, search, vacancyId, applicantId, status } = request;

    const qb = this.applicationsTable.createQueryBuilder('application');

    qb.leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('applicant.user', 'user')
      .leftJoinAndSelect('application.cv', 'cv');

    //Filter
    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('application.vacancy.title ILIKE :search').orWhere(
            'user.fullName ILIKE :search',
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
    let application: Application;
    await this.applicationsTable.manager.transaction(async (manager) => {
      const applicant = await this.customValidator.getOneOrFail<Applicant>(
        manager,
        Applicant,
        { id: data.applicantId },
        'Applicant',
      );

      if (
        [ApplicantStatus.BANNED, ApplicantStatus.HIRED].includes(
          applicant.status,
        )
      ) {
        throw new BadRequestException(
          `Applicant is already ${applicant.status}`,
        );
      }

      const vacancy = await this.customValidator.getOneOrFail(
        manager,
        Vacancy,
        { id: data.vacancyId },
        'Vacancy',
      );

      let cv: CV | null = null;
      if (data.cvId) {
        cv = await manager.findOne(CV, { where: { id: data.cvId } });
        if (cv) {
          await this.customValidator.cvOwnershipValidator(
            manager,
            cv.id,
            applicant.id,
          );
        }
      }

      application = manager.create(Application, {
        ...data,
        applicant,
        vacancy,
        cv,
      });

      application = await manager.save(application);

      //update applicant status
      await this.applicantService.changeStatus(
        applicant.id,
        ApplicantStatus.IN_PROCESS,
      );

      // AI preview
      if (application.cv) {
        try {
          const aiResponse = await this.aiService.reviewCv(application);
          if (aiResponse) {
            application.aiPreview = aiResponse;
          }
        } catch (err) {
          console.log(err);
        }
      }
      application = await manager.save(application);
    });
    try {
      // 1. Phát sự kiện Real-time cho NotificationGateway
      this.eventEmitter.emit('notification.send', {
        notificationId: `notif-${application!.id}`,
        type: 'SUCCESS',
        message: `Ứng viên ${application!.applicant.user.fullName} vừa nộp CV vào vị trí ${application!.vacancy.title}`,
        linkUrl: `/hr-portal/applications/${application!.id}`,
        createdAt: new Date().toISOString(),
      });

      // 2. Phát sự kiện để Hàng đợi (Email Queue) bắt lấy và gửi mail ngầm
      this.eventEmitter.emit('application.submitted', {
        applicationId: application!.id,
        candidateEmail: application!.applicant.user.email,
        candidateName: application!.applicant.user.fullName,
        vacancyTitle: application!.vacancy.title,
      });
    } catch (err) {
      console.log(err);
    }

    return application!;
  }

  async changeStatus(id: number, status: ApplicationStatus) {
    const application = await this.findById(id);
    application.status = status;
    return this.applicationsTable.save(application);
  }
}
