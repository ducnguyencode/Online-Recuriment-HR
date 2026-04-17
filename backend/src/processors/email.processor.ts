import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('email-queue')
export class EmailProcessor {
    private transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    @Process('send-thank-you')
    async handleSendThankYouEmail(job: Job) {
        const { candidateEmail, candidateName, vacancyTitle } = job.data;

        const mailOptions = {
            from: `"Tuyển dụng Online" <${this.configService.get<string>('SMTP_USER')}>`,
            to: candidateEmail,
            subject: `Xác nhận ứng tuyển thành công - Vị trí ${vacancyTitle}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Chào ${candidateName},</h2>
          <p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <b>${vacancyTitle}</b>.</p>
          <p>Hệ thống đã tiếp nhận hồ sơ (CV) của bạn. AI và Bộ phận nhân sự sẽ đánh giá mức độ phù hợp và phản hồi lại bạn sớm nhất có thể.</p>
          <br/>
          <p>Trân trọng,</p>
          <p><b>Phòng Nhân Sự</b></p>
        </div>
      `,
        };
        await this.transporter.sendMail(mailOptions);
    }

    @Process('send-account-password')
    async handleSendAccountPassword(job: Job) {
        const { email, fullName, password, role } = job.data;

        const mailOptions = {
            from: `"Tuyển dụng Online" <${this.configService.get<string>('SMTP_USER')}>`,
            to: email,
            subject: 'Tai khoan he thong tuyen dung da duoc tao',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Chao ${fullName},</h2>
          <p>Tai khoan ${role} cua ban tren he thong tuyen dung da duoc tao.</p>
          <p>Email dang nhap: <b>${email}</b></p>
          <p>Mat khau tam thoi: <b>${password}</b></p>
          <p style="color: #c0392b;"><b>Luu y:</b> Hay dang nhap va doi mat khau ngay sau lan dang nhap dau tien de dam bao an toan.</p>
          <br/>
          <p>Tran trong,</p>
          <p><b>He thong quan tri</b></p>
        </div>
      `,
        };

        await this.transporter.sendMail(mailOptions);
    }
}