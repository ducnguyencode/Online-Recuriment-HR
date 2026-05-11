import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Applicant } from 'src/entities/applicant.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { CV } from 'src/entities/cv.entity';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { CustomValidator } from 'src/common/validator/custom.validator';
import { ApplicantService } from './applicant.service';
import {
  ApplicantStatus,
  ApplicationStatus,
  VacancyStatus,
} from 'src/common/enum';
import { AiPreviewService } from './bullmq/ai-worker/ai-preview.service';
import { SendMailService } from './bullmq/send-mail-worker/send-mail.service';
import { AiPreviewStatus } from 'src/dto/ai.response.dto';
import path from 'path';
import fs from 'fs';

@Injectable()
export class ApplicationService implements OnModuleInit {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    @InjectRepository(Vacancy) private vacancyTable: Repository<Vacancy>,
    private customValidator: CustomValidator,
    private applicantService: ApplicantService,
    private eventEmitter: EventEmitter2,
    private aiPreviewService: AiPreviewService,
    private sendMailService: SendMailService,
  ) {}

  async onModuleInit() {
    await this.normalizeLegacyFinalStatus();
  }

  // One-time data migration for legacy "Accepted" rows.
  // Cheap COUNT guard ensures the UPDATE only fires when legacy rows exist —
  // every subsequent boot is a single indexed count.
  private async normalizeLegacyFinalStatus() {
    const legacyCount = await this.applicationsTable
      .createQueryBuilder()
      .where('status = :legacyStatus', { legacyStatus: 'Accepted' })
      .getCount();

    if (legacyCount === 0) {
      return;
    }

    const result = await this.applicationsTable
      .createQueryBuilder()
      .update(Application)
      .set({ status: ApplicationStatus.SELECTED })
      .where('status = :legacyStatus', { legacyStatus: 'Accepted' })
      .execute();

    this.logger.log(
      `Normalized ${result.affected ?? 0} legacy "Accepted" application(s) to SELECTED`,
    );
  }

  private async createSubmittedCvSnapshot(cv: CV, applicationId: number) {
    if (!cv.fileUrl) {
      throw new BadRequestException('CV file not found');
    }

    const sourcePath = path.join(process.cwd(), 'uploads', cv.fileUrl);
    const safeFileName = path.basename(cv.fileName || cv.fileUrl);
    const snapshotPath = `application-cvs/application-${applicationId}`;
    const uploadDir = path.join(process.cwd(), 'uploads', snapshotPath);
    const targetPath = path.join(uploadDir, safeFileName);

    const resolvedTarget = path.resolve(targetPath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!resolvedTarget.startsWith(resolvedUploadDir + path.sep)) {
      throw new BadRequestException('Invalid CV file name');
    }

    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.copyFile(sourcePath, targetPath);
    } catch (err) {
      throw new BadRequestException(
        'Cannot preserve submitted CV for this application',
      );
    }

    return {
      submittedCvOriginalCvId: cv.id,
      submittedCvFileName: cv.fileName || safeFileName,
      submittedCvFileUrl: `${snapshotPath}/${safeFileName}`,
    };
  }

  async findAll(
    request: ApplicationFindDto,
  ): Promise<FindResponseDto<Application>> {
    const {
      page,
      limit,
      search,
      vacancyId,
      applicantId,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = request;

    const qb = this.applicationsTable.createQueryBuilder('application');

    qb.leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('applicant.user', 'user')
      .leftJoinAndSelect('application.cv', 'cv')
      .leftJoinAndSelect('application.interviews', 'interview')
      .leftJoinAndSelect('interview.panels', 'panel')
      .leftJoinAndSelect('panel.employee', 'panelEmployee')
      .leftJoinAndSelect('panelEmployee.user', 'panelUser');

    //Filter
    if (search) {
      qb.andWhere(
        '(vacancy.title ILIKE :search OR user.fullName ILIKE :search OR user.email ILIKE :search OR application.code ILIKE :search OR applicant.code ILIKE :search OR vacancy.code ILIKE :search)',
        { search: `%${search}%` },
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

    // Filter date
    if (startDate && endDate) {
      qb.andWhere(
        "application.createdAt >= :startDate::timestamptz AND application.createdAt < (:endDate::timestamptz + INTERVAL '1 day')",
        { startDate, endDate },
      );
    } else if (startDate) {
      qb.andWhere('application.createdAt >= :startDate::timestamptz', {
        startDate,
      });
    } else if (endDate) {
      qb.andWhere(
        "application.createdAt < (:endDate::timestamptz + INTERVAL '1 day')",
        { endDate },
      );
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    const normalizedSortOrder =
      String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortBy === 'aiScore') {
      const aiScoreSortSql =
        "CASE WHEN application.aiPreview ? 'matchScore' AND (application.aiPreview ->> 'matchScore') ~ '^[0-9]+(\\.[0-9]+)?$' THEN (application.aiPreview ->> 'matchScore')::numeric ELSE NULL END";

      qb.addSelect(aiScoreSortSql, 'ai_score_sort')
        .orderBy('ai_score_sort', normalizedSortOrder, 'NULLS LAST')
        .addOrderBy('application.createdAt', 'DESC');
    } else {
      qb.orderBy('application.createdAt', normalizedSortOrder);
    }

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

      if (vacancy.status !== VacancyStatus.OPENED) {
        throw new ForbiddenException(`Vacancy already ${vacancy.status}`);
      }

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

      if (cv) {
        const cvSnapshot = await this.createSubmittedCvSnapshot(
          cv,
          application.id,
        );
        application.submittedCvOriginalCvId =
          cvSnapshot.submittedCvOriginalCvId;
        application.submittedCvFileName = cvSnapshot.submittedCvFileName;
        application.submittedCvFileUrl = cvSnapshot.submittedCvFileUrl;
      }

      //update applicant status
      await this.applicantService.changeStatus(
        applicant.id,
        ApplicantStatus.IN_PROCESS,
      );

      if (application.submittedCvFileUrl || application.cv) {
        application.aiPreview ??= { status: AiPreviewStatus.IDLE } as any;
        application.aiPreview.status = AiPreviewStatus.RUNNING;
      }

      application = await manager.save(application);

      if (application.submittedCvFileUrl || application.cv) {
        await this.aiPreviewService.start(application.id);
      }
    });

    const fullApplication = await this.applicationsTable.findOne({
      where: { id: application!.id },
      relations: ['applicant', 'applicant.user', 'vacancy'],
    });

    try {
      // Emit an event so the background email queue can notify HR.
      this.eventEmitter.emit('application.submitted', {
        applicationId: fullApplication!.id,
        candidateEmail: fullApplication!.applicant.user.email,
        candidateName: fullApplication!.applicant.user.fullName,
        vacancyTitle: fullApplication!.vacancy.title,
        targetHrId: fullApplication!.vacancy.createdById,
      });
    } catch (err) {
      this.logger.error('Failed to emit application.submitted event', err as Error);
    }

    return fullApplication || application!;
  }

  async changeStatus(id: number, status: ApplicationStatus) {
    let applicationId = id;
    await this.applicationsTable.manager.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (
        status === ApplicationStatus.SELECTED &&
        application.status !== ApplicationStatus.SELECTED
      ) {
        const vacancy = await manager.findOne(Vacancy, {
          where: { id: application.vacancyId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!vacancy) {
          throw new NotFoundException('Vacancy not found');
        }
        // Pattern A (soft close): SUSPENDED pauses the entire pipeline.
        // CLOSED only blocks NEW applications; in-flight candidates can still
        // be selected as long as openings remain.
        if (vacancy.status === VacancyStatus.SUSPENDED) {
          throw new ForbiddenException(
            'Vacancy is suspended. Resume it before selecting candidates.',
          );
        }
        if (vacancy.filledCount >= vacancy.numberOfOpenings) {
          throw new ForbiddenException(
            `This vacancy has no remaining openings.`,
          );
        }

        vacancy.filledCount++;
        if (vacancy.filledCount >= vacancy.numberOfOpenings) {
          vacancy.status = VacancyStatus.CLOSED;
        }
        await manager.save(Vacancy, vacancy);

        await manager.update(Applicant, application.applicantId, {
          status: ApplicantStatus.HIRED,
        });
      }

      application.status = status;
      const saved = await manager.save(Application, application);
      applicationId = saved.id;
    });

    const application = await this.applicationsTable.findOne({
      where: { id: applicationId },
      relations: ['applicant.user', 'vacancy', 'vacancy.department'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status === ApplicationStatus.SELECTED) {
      await this.sendMailService.addToQueue(
        application.applicant.user.email,
        `${application.applicant.user.fullName}`,
        'Congratulation',
        {
          position: application.vacancy.title,
          company: 'HR RECRUITMENT',
          startDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          department: application.vacancy.department?.name,
        },
      );
    }

    return application;
  }

  async changeAiPreviewStatus(id: number, status: AiPreviewStatus) {
    const application = await this.findById(id);
    application.aiPreview.status = status;
    await this.applicationsTable.save(application);
  }

  async getApplicantById(applicantId: number): Promise<Applicant | null> {
    return this.applicationsTable.manager.findOne(Applicant, {
      where: { id: applicantId },
    });
  }

  async checkDuplicate(applicantId: number, vacancyId: number) {
    const exists = await this.applicationsTable.exists({
      where: {
        applicantId,
        vacancyId,
      },
    });

    if (exists) {
      throw new BadRequestException('Already applied');
    }
  }
}
