import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer'; // Utilizing your existing setup
import { EmailQueue } from '../entities/email-queue.entity';

@Injectable()
export class EmailCronService {
    private readonly logger = new Logger(EmailCronService.name);

    // Flag to prevent overlapping executions if the mail server is slow
    private isProcessing = false;

    constructor(
        @InjectRepository(EmailQueue)
        private emailQueueRepo: Repository<EmailQueue>,
        private mailerService: MailerService,
    ) { }

    // CRON JOB: Process Email Queue
    // Executes every minute. Fetches pending emails and dispatches them.
    @Cron(CronExpression.EVERY_MINUTE)
    async processEmailQueue() {
        // 1. Prevent concurrent runs
        if (this.isProcessing) {
            this.logger.warn('[Email Worker] Previous batch is still processing. Skipping this cycle.');
            return;
        }

        this.isProcessing = true;

        try {
            // 2. Fetch pending emails (limit to 30 per minute to avoid spam/rate limits)
            const emailsToSend = await this.emailQueueRepo.find({
                where: [
                    { status: 'Pending' },
                    { status: 'Failed', retryCount: LessThan(3) }
                ],
                take: 30,
                order: { createdAt: 'ASC' } // First In, First Out (FIFO)
            });

            if (emailsToSend.length === 0) {
                return;
            }

            this.logger.log(`[Email Worker] Processing ${emailsToSend.length} emails...`);

            // 3. Loop through and dispatch emails
            for (const email of emailsToSend) {
                try {
                    await this.mailerService.sendMail({
                        to: email.recipientEmail,
                        subject: email.subject,
                        html: email.bodyHtml,
                    });

                    email.status = 'Sent';
                    email.sentAt = new Date();
                    await this.emailQueueRepo.save(email);

                    this.logger.log(`[Email Worker] ✅ Successfully sent to: ${email.recipientEmail}`);

                } catch (sendError) {
                    email.status = 'Failed';
                    email.retryCount += 1;
                    await this.emailQueueRepo.save(email);

                    this.logger.error(
                        `[Email Worker] ❌ Failed to send to: ${email.recipientEmail}. Retry count: ${email.retryCount}`,
                        sendError.stack
                    );
                }
            }

        } catch (dbError) {
            this.logger.error(`[Email Worker] Database connection error: ${dbError.message}`);
        } finally {
            this.isProcessing = false;
        }
    }
}