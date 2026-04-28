import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AI_PREVIEW_JOB, AI_PREVIEW_QUEUE } from './ai-preview.constants';
import { Queue } from 'bullmq';
import { AiPreviewJobData } from './ai-preview.type';
import { Application } from 'src/entities/application.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiResponseDto } from 'src/dto/ai.response.dto';
import { AiService } from '../../ai.service';

@Injectable()
export class AiPreviewService {
  constructor(
    @InjectQueue(AI_PREVIEW_QUEUE)
    private readonly aiPreviewQueue: Queue<AiPreviewJobData>,
    @InjectRepository(Application)
    private applicationTable: Repository<Application>,
    private aiService: AiService,
  ) {}
  async start(applicationId: number) {
    await this.aiPreviewQueue.add(
      AI_PREVIEW_JOB,
      {
        applicationId,
      },
      { removeOnComplete: true, removeOnFail: false },
    );
  }

  async updateApplication(id: number, result: AiResponseDto) {
    const res = await this.applicationTable.update(
      { id },
      { aiPreview: result },
    );

    if (res.affected === 0) {
      throw new NotFoundException('Application Not Found');
    }

    return { success: true };
  }

  async reviewCvApplication(
    applicationId: number,
  ): Promise<AiResponseDto | null> {
    const application = await this.applicationTable.findOne({
      where: { id: applicationId },
      relations: ['vacancy', 'applicant', 'cv'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return await this.aiService.reviewCv(application);
  }
}
