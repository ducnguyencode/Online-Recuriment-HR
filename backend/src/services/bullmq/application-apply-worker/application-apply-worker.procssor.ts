import { Processor, WorkerHost } from '@nestjs/bullmq';
import { APPLICATION_APPLY_QUEUE } from './application-apply-worker.constants';
import { Job } from 'bullmq';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { ApplicationService } from 'src/services/application.service';

@Processor(APPLICATION_APPLY_QUEUE)
export class ApplicationApplyProcessor extends WorkerHost {
  constructor(private applicationService: ApplicationService) {
    super();
  }

  async process(job: Job<ApplicationCreateDto>): Promise<any> {
    const result = await this.applicationService.create(job.data);
    return {
      jobId: job.id,
      result,
      finishAt: new Date().toDateString(),
    };
  }
}
