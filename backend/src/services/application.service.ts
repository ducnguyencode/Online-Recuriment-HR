import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application.create.dto';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { CV } from 'src/entities/cv.entity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    @InjectRepository(CV)
    private cvsTable: Repository<CV>,
    private aiService: AiService,
  ) {}

  findAll(): Promise<Application[]> {
    return this.applicationsTable.find({
      relations: { applicant: true, vacancy: true, cv: true },
    });
  }

  async findById(id: string): Promise<Application> {
    return await this.applicationsTable.findOneOrFail({
      where: { id },
      relations: { applicant: true, vacancy: true, cv: true },
    });
  }

  async create(data: ApplicationCreateDto) {
    const cvId = data.cvId ?? await this.resolveCvId(data.applicantId);

    const application = this.applicationsTable.create({
      applicant: { id: data.applicantId },
      vacancy: { id: data.vacancyId },
      cv: { id: cvId },
      ...(data.status ? { status: data.status } : {}),
      ...(data.hrNotes ? { hrNotes: data.hrNotes } : {}),
    });

    const savedApplication = await this.applicationsTable.save(application);

    // AI preview
    const applicationData = await this.findById(savedApplication.id);
    try {
      const aiResponse = await this.aiService.reviewCv(
        applicationData.cv.fileUrl,
        applicationData,
      );
      if (aiResponse) {
        application.aiPrivew = aiResponse;
        await this.applicationsTable.save(savedApplication);
      }
    } catch (err) {
      console.log(err);
    }

    return savedApplication;
  }

  async changeStatus(id: string, status: ApplicationStatus) {
    const application = await this.findById(id);
    application.status = status;
    return this.applicationsTable.save(application);
  }

  private async resolveCvId(applicantId: string): Promise<string> {
    const cv = await this.cvsTable.findOne({
      where: { applicantId },
      order: { createdAt: 'DESC' },
    });

    if (!cv) {
      throw new BadRequestException(
        `CV not found for applicantId=${applicantId}`,
      );
    }
    return cv.id;
  }
}
