import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailQueueService {
    constructor(@InjectQueue('email-queue') private emailQueue: Queue) { }

    @OnEvent('application.submitted')
    async handleApplicationSubmitted(payload: any) {
        await this.emailQueue.add('send-thank-you', payload, {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
        });
    }

    @OnEvent('user.account-created')
    async handleUserAccountCreated(payload: any) {
        await this.emailQueue.add('send-account-password', payload, {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
        });
    }
}