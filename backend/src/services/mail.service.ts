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
    options?: {
      requireInitialPasswordSetup?: boolean;
    },
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

    const requireInitialPasswordSetup =
      options?.requireInitialPasswordSetup ?? false;
    const instructionBlock = requireInitialPasswordSetup
      ? '<p>After verification, you will continue to set your initial password.</p>'
      : '<p>After verification, you can sign in with your registered password.</p>';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>Please verify your account by clicking the button below.</p>
        ${instructionBlock}
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
        subject: requireInitialPasswordSetup
          ? 'Verify account and set your password'
          : 'Verify your account',
        htmlContent,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Brevo email send failed: ${body}`);
      }
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
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
        <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>If the button does not work, use this link:</p>
        <p>${resetUrl}</p>
      </div>
    `;

    if (!apiKey) {
      this.logger.warn(
        `BREVO_API_KEY is missing. Password reset link for ${email}: ${resetUrl}`,
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
        subject: 'Reset your password',
        htmlContent,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Brevo password reset email send failed: ${body}`);
      }
    });
  }

  async sendRoleChangedEmail(input: {
    email: string;
    name: string;
    actorName: string;
    fromRole: string;
    toRole: string;
    reason: string;
  }) {
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
        <h2>Hello ${input.name},</h2>
        <p>A staff role update has been recorded by <strong>${input.actorName}</strong>.</p>
        <p><strong>From:</strong> ${input.fromRole}</p>
        <p><strong>To:</strong> ${input.toRole}</p>
        <p><strong>Reason:</strong> ${input.reason}</p>
        <p>This notification is for audit awareness only.</p>
      </div>
    `;

    if (!apiKey) {
      this.logger.warn(
        `BREVO_API_KEY is missing. Role-change email for ${input.email} skipped.`,
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
            email: input.email,
            name: input.name,
          },
        ],
        subject: 'Staff role updated',
        htmlContent,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Brevo role-change email send failed: ${body}`);
      }
    });
  }
}
