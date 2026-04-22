import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Sends transactional email via Brevo REST API only. */
@Injectable()
export class BrevoApiService {
  private readonly logger = new Logger(BrevoApiService.name);

  constructor(private readonly config: ConfigService) {}

  private senderFromEnv(): { email: string; name: string } {
    const email =
      this.config.get<string>('BREVO_FROM_EMAIL')?.trim() ||
      this.config.get<string>('SMTP_FROM')?.trim() ||
      this.config.get<string>('BREVO_SMTP_USER')?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim();
    if (!email) {
      throw new Error(
        'BREVO_FROM_EMAIL (or SMTP_FROM) is not set. You can also use BREVO_SMTP_USER/SMTP_USER as fallback sender.',
      );
    }
    const name =
      this.config.get<string>('BREVO_FROM_NAME')?.trim() || 'HR Recruitment';
    return { email, name };
  }

  async sendTransactionalEmail(params: {
    toEmail: string;
    toName?: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const rawKey = this.config.get<string>('BREVO_API_KEY')?.trim() ?? '';
    if (!rawKey) {
      throw new Error('BREVO_API_KEY is missing.');
    }
    if (rawKey.startsWith('xsmtpsib-')) {
      throw new Error(
        'BREVO_API_KEY must be a Brevo REST v3 API key (xkeysib-...), not SMTP key.',
      );
    }
    await this.sendViaRest(rawKey, params);
  }

  private async sendViaRest(
    apiKey: string,
    params: {
      toEmail: string;
      toName?: string;
      subject: string;
      html: string;
    },
  ): Promise<void> {
    const { email: fromEmail, name: fromName } = this.senderFromEnv();
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: params.toEmail, name: params.toName ?? params.toEmail }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Brevo REST ${res.status}: ${text}`);
      throw new Error(`Brevo REST ${res.status}: ${text}`);
    }
    const body = await res.json().catch(() => ({}) as Record<string, unknown>);
    this.logger.log(
      `Brevo REST accepted messageId=${String((body as { messageId?: unknown }).messageId ?? 'n/a')}`,
    );
  }
}
