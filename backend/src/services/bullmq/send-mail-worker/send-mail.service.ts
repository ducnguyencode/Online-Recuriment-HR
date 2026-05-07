import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { SEND_MAIL_JOB, SEND_MAIL_QUEUE } from './send-mail.constants';
import { Queue } from 'bullmq';
import { SendMailJobData } from './send-mail.type';

@Injectable()
export class SendMailService {
  private readonly logger = new Logger(SendMailService.name);

  constructor(
    @InjectQueue(SEND_MAIL_QUEUE)
    private readonly sendMailQueue: Queue<SendMailJobData>,
    private readonly configService: ConfigService,
  ) {}

  async addToQueue(email: string, name: string, subject: string, detail: any) {
    await this.sendMailQueue.add(
      SEND_MAIL_JOB,
      { email, name, subject, detail },
      { removeOnComplete: true, removeOnFail: false },
    );
  }

  private renderTemplate(templateName: string, data: any): string {
    const filePath = path.join(
      __dirname,
      'templates',
      `${templateName}.hbs`,
    );

    const source = fs.readFileSync(filePath, 'utf8');
    const template = Handlebars.compile(source);

    return template(data);
  }

  async sendMail(email: string, name: string, subject: string, detail: any) {
    const senderEmail = this.configService.get<string>(
      'BREVO_SENDER_EMAIL',
      'no-reply@example.com',
    );
    const senderName = this.configService.get<string>(
      'BREVO_SENDER_NAME',
      'Authorize App',
    );
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    const htmlContent = this.renderTemplate('congrat', {
      name,
      ...detail,
    });

    if (!apiKey) {
      this.logger.warn(`BREVO_API_KEY is missing.`);
      return;
    }

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [
          {
            email,
          },
        ],
        subject: subject,
        htmlContent,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Brevo email send failed: ${body}`);
      }
    });
  }
}
