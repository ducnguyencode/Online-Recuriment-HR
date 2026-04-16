import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('email-queue') // Khai báo anh thợ này chuyên xử lý 'email-queue'
export class EmailProcessor {
    private transporter;

    constructor(private configService: ConfigService) {
        // Cấu hình trạm phát tín hiệu theo chuẩn Brevo SMTP
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'), // smtp-relay.brevo.com
            port: this.configService.get<number>('SMTP_PORT'), // 587
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    // Nhận việc: Chỉ xử lý tờ note có tiêu đề 'send-thank-you'
    @Process('send-thank-you')
    async handleSendThankYouEmail(job: Job) {
        const { candidateEmail, candidateName, vacancyTitle } = job.data;

        console.log(`[Worker] Tiến hành gửi email cảm ơn cho: ${candidateEmail}...`);

        const mailOptions = {
            from: `"Tuyển dụng Online" <${this.configService.get<string>('SMTP_USER')}>`, // Hoặc email đại diện công ty
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

        // Tiến hành gửi (quá trình này mất khoảng 2-3s nhưng chạy ngầm nên không ảnh hưởng ai)
        await this.transporter.sendMail(mailOptions);

        console.log(`[Worker] ✅ Đã gửi email THÀNH CÔNG tới: ${candidateEmail}`);
    }
}