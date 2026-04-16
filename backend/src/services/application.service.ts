import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { ApplicationCreateDto } from 'src/dto/application.create.dto';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationsTable: Repository<Application>,
    private aiService: AiService,
    private eventEmitter: EventEmitter2,
  ) { }

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

    // 1. Phát sự kiện Real-time cho NotificationGateway
    this.eventEmitter.emit('notification.send', {
      notificationId: `notif-${application.id}`,
      type: 'SUCCESS',
      message: `Ứng viên ${applicationData.applicant.fullName} vừa nộp CV vào vị trí ${applicationData.vacancy.title}`,
      linkUrl: `/hr-portal/applications/${application.id}`,
      createdAt: new Date().toISOString()
    });

    // 2. Phát sự kiện để Hàng đợi (Email Queue) bắt lấy và gửi mail ngầm
    this.eventEmitter.emit('application.submitted', {
      applicationId: application.id,
      candidateEmail: applicationData.applicant.email,
      candidateName: applicationData.applicant.fullName,
      vacancyTitle: applicationData.vacancy.title
    });

    return application;
  }

  async changeStatus(id: string, status: ApplicationStatus) {
    const application = await this.findById(id);
    application.status = status;
    return this.applicationsTable.save(application);
  }
}
