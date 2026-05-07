import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SEND_MAIL_QUEUE } from './send-mail.constants';
import { SendMailService } from './send-mail.service';
import { SendMailJobData } from './send-mail.type';

@Processor(SEND_MAIL_QUEUE, { concurrency: 5 })
export class SendMailProcessor extends WorkerHost {
  constructor(private sendMailService: SendMailService) {
    super();
  }

  async process(job: Job<SendMailJobData>) {
    console.log(job.data);
    await this.sendMailService.sendMail(
      job.data.email,
      job.data.name,
      job.data.subject,
      job.data.detail,
    );
    return {
      jobId: job.id,
      data: job.data,
      finishAt: new Date().toISOString(),
    };
  }
}
