import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(
    email: string,
    name: string,
    verifyUrl: string,
    rawPassword?: string,
  ) {
    const senderEmail = this.configService.get<string>(
      'BREVO_SENDER_EMAIL',
      'no-reply@example.com',
    );
    const senderName = this.configService.get<string>(
      'BREVO_SENDER_NAME',
      'Authorize App',
    );
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>Please verify your account by clicking the button below.</p>
        ${
          rawPassword
            ? `<p>Your temporary password is: <strong>${rawPassword}</strong></p>`
            : ''
        }
        ${
          rawPassword
            ? '<p>This account will be deleted automatically if it is not verified within 5 minutes.</p>'
            : ''
        }
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:8px;">Verify Email</a></p>
        <p>If the button does not work, use this link:</p>
        <p>${verifyUrl}</p>
      </div>
    `;

    if (!apiKey) {
      this.logger.warn(
        `BREVO_API_KEY is missing. Verification email for ${email}: ${verifyUrl}`,
      );
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
            name,
          },
        ],
        subject: 'Verify your account',
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
