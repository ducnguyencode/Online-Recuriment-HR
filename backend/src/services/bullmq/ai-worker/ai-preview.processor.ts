import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiPreviewJobData } from './ai-preview.type';
import { AI_PREVIEW_QUEUE } from './ai-preview.constants';
import { AiPreviewService } from './ai-preview.service';
import { AiPreviewGateway } from './ai-preview.gateway';

@Processor(AI_PREVIEW_QUEUE, { concurrency: 5 })
export class AiPreviewProcessor extends WorkerHost {
  constructor(
    private aiPreviewService: AiPreviewService,
    private gateway: AiPreviewGateway,
  ) {
    super();
  }

  async process(job: Job<AiPreviewJobData>) {
    this.gateway.emitUpdateApplication('new', job.data.applicationId);
    const result = await this.aiPreviewService.reviewCvApplication(
      job.data.applicationId,
    );

    return {
      jobId: job.id,
      result,
      data: job.data,
      finishAt: new Date().toISOString(),
    };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<AiPreviewJobData> | undefined) {
    if (!job) {
      return;
    }
    await this.aiPreviewService.updateApplication(
      job.data.applicationId,
      job.returnvalue.result,
    );
    this.gateway.emitUpdateApplication(
      job.returnvalue.result,
      job.data.applicationId,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AiPreviewJobData> | undefined) {
    if (!job) {
      return;
    }
    await this.aiPreviewService.updateApplicationOnPreviewError(
      job.data.applicationId,
    );
    this.gateway.emitUpdateApplication(job.stacktrace, job.data.applicationId);
  }
}
