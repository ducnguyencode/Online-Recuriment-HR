import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application.create.dto';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ApplicationStatus } from 'src/enum/application-status.enum';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    private aiService: AiService,
  ) {}

  findAll(): Promise<Application[]> {
    return this.applicationsTable.find({
      relations: { applicant: true, vacancy: true, cv: true },
    });
  }

  async findById(id: number): Promise<Application> {
    return await this.applicationsTable.findOneOrFail({
      where: { id },
      relations: { applicant: true, vacancy: true, cv: true },
    });
  }

  async create(data: ApplicationCreateDto) {
    let application = this.applicationsTable.create({
      ...data,
      applicant: { id: data.applicantId },
      vacancy: { id: data.vacancyId },
      cv: { id: data.cvId },
    });

    application = await this.applicationsTable.save(application);

    // AI preview
    const applicationData = await this.findById(application.id);
    try {
      const aiResponse = await this.aiService.reviewCv(
        applicationData.cv.fileUrl,
        applicationData,
      );
      if (aiResponse) {
        application.aiPrivew = aiResponse;
        await this.applicationsTable.save(application);
      }
    } catch (err) {
      console.log(err);
    }

    return application;
  }

  async changeStatus(id: number, status: ApplicationStatus) {
    const application = await this.findById(id);
    application.status = status;
    return this.applicationsTable.save(application);
  }
}
