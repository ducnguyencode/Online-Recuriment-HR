import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailQueue } from '../entities/email-queue.entity';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectRepository(EmailQueue)
    private emailQueueRepo: Repository<EmailQueue>,
  ) {}

  @OnEvent('application.submitted')
  async handleApplicationSubmitted(payload: any) {
    this.logger.log(
      `[Queue] Received application from ${payload.candidateName}. Saving email to Database...`,
    );

    try {
      const newEmail = this.emailQueueRepo.create({
        recipientEmail: payload.candidateEmail, // Đảm bảo payload của bạn có trường này
        subject: `Apply Success - Vacancy ${payload.vacancyTitle}`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color: #2c3e50;">Hi ${payload.candidateName},</h2>
            <p>Thank you for your interest and application for the position of <b>${payload.vacancyTitle}</b>.</p>
            <p>The system has received your CV. The HR department will evaluate your qualifications and respond to you as soon as possible.</p>
            <br/>
            <p>Sincerly,</p>
            <p><b>HR Department</b></p>
          </div>
        `,
        emailType: 'Register',
        status: 'Pending',
      });

      await this.emailQueueRepo.save(newEmail);
      this.logger.log(
        `[Queue] ✅ Saved thank you email for ${payload.candidateEmail} to the queue.`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Queue] ❌ Error saving email to DB: ${error.message}`,
      );
    }
  }
}
