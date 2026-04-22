import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailQueueService {
  // Inject queue named 'email-queue'
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  // Listen for application submitted event
  @OnEvent('application.submitted')
  async handleApplicationSubmitted(payload: any) {
    console.log(
      `[Queue] Received CV submission from ${payload.candidateName}. Pushing job to Redis queue...`,
    );

    // Push 'send-thank-you' job to queue
    await this.emailQueue.add('send-thank-you', payload, {
      attempts: 3, // Retry up to 3 times on transient email failure
      backoff: 5000, // 5-second backoff between attempts
      removeOnComplete: true, // Cleanup successful jobs
    });
  }
}
