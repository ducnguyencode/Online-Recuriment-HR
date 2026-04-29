import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailQueue } from '../entities/email-queue.entity';

@Injectable()
export class EmailCronService {
  private readonly logger = new Logger(EmailCronService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(EmailQueue)
    private emailQueueRepo: Repository<EmailQueue>,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processEmailQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Get email queue
      const emailsToSend = await this.emailQueueRepo.find({
        where: [
          { status: 'Pending' },
          { status: 'Failed', retryCount: LessThan(3) },
        ],
        take: 30,
        order: { createdAt: 'ASC' },
      });

      if (emailsToSend.length === 0) return;

      this.logger.log(
        `[Email Cron] Sending ${emailsToSend.length} emails via Brevo API...`,
      );

      const apiKey = this.configService.get<string>('BREVO_API_KEY');
      const senderEmail = this.configService.get<string>(
        'BREVO_SENDER_EMAIL',
        'no-reply@example.com',
      );
      const senderName = this.configService.get<string>(
        'BREVO_SENDER_NAME',
        'HR Recruitment',
      );

      if (!apiKey) {
        this.logger.error(
          '[Email Cron] Error: BREVO_API_KEY not found in .env file. Stopping email sending!',
        );
        return;
      }

      // 2. Send email
      for (const email of emailsToSend) {
        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
            body: JSON.stringify({
              sender: { email: senderEmail, name: senderName },
              to: [{ email: email.recipientEmail }],
              subject: email.subject,
              htmlContent: email.bodyHtml,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Brevo API Error: ${errorBody}`);
          }
          email.status = 'Sent';
          email.sentAt = new Date();
          await this.emailQueueRepo.save(email);
          this.logger.log(
            `[Email Cron] ✅ Sent successfully to: ${email.recipientEmail}`,
          );
        } catch (error: any) {
          email.status = 'Failed';
          email.retryCount += 1;
          await this.emailQueueRepo.save(email);
          this.logger.error(
            `[Email Cron] ❌ Error sending to ${email.recipientEmail}. Retry: ${email.retryCount}`,
            error.message,
          );
        }
      }
    } catch (dbError) {
      this.logger.error('[Email Cron] Error', dbError);
    } finally {
      this.isProcessing = false;
    }
  }
}
