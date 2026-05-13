import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiPreviewJobData } from './ai-preview.type';
import { AI_PREVIEW_QUEUE } from './ai-preview.constants';
import { AiPreviewService } from './ai-preview.service';
import { AiPreviewGateway } from './ai-preview.gateway';
import { ApplicationService } from 'src/services/application.service';
import { AiPreviewStatus } from 'src/dto/ai.response.dto';

@Processor(AI_PREVIEW_QUEUE, { concurrency: 5 })
export class AiPreviewProcessor extends WorkerHost {
  constructor(
    private aiPreviewService: AiPreviewService,
    private gateway: AiPreviewGateway,
    private applicationService: ApplicationService,
  ) {
    super();
  }

  async process(job: Job<AiPreviewJobData>) {
    const application = await this.applicationService.findById(
      job.data.applicationId,
    );
    if (!application.submittedCvFileUrl && !application.cv) {
      return null;
    }
    await this.applicationService.changeAiPreviewStatus(
      application.id,
      AiPreviewStatus.RUNNING,
    );
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
    if (!job || !job.returnvalue) {
      return;
    }
    if (!job.returnvalue.result) {
      // CV missing or AI returned unparseable response → mark FAILED
      await this.aiPreviewService.updateApplicationOnPreviewError(
        job.data.applicationId,
      );
      this.gateway.emitUpdateApplication(null, job.data.applicationId);
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
