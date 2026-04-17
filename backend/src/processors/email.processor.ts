import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email-queue')
export class EmailProcessor {

    // MailerService này sẽ tự lấy cấu hình từ app.module.ts
    constructor(private readonly mailerService: MailerService) { }

    @Process('send-thank-you')
    async handleSendThankYouEmail(job: Job) {
        const { candidateEmail, candidateName, vacancyTitle } = job.data;

        console.log(`[Worker] Tiến hành gửi email cảm ơn cho: ${candidateEmail}...`);

        // Dùng this.mailerService thay cho this.transporter
        await this.mailerService.sendMail({
            to: candidateEmail,
            subject: `Xác nhận ứng tuyển thành công - Vị trí ${vacancyTitle}`,
            // Bạn có thể giữ nguyên html cũ, hoặc sau này rảnh thì chuyển sang file .hbs
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Chào ${candidateName},</h2>
          <p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <b>${vacancyTitle}</b>.</p>
          <p>Hệ thống đã tiếp nhận hồ sơ (CV) của bạn. Bộ phận nhân sự sẽ đánh giá mức độ phù hợp và phản hồi lại bạn sớm nhất có thể.</p>
          <br/>
          <p>Trân trọng,</p>
          <p><b>Phòng Nhân Sự</b></p>
        </div>
      `,
        });

        console.log(`[Worker] ✅ Đã gửi email THÀNH CÔNG tới: ${candidateEmail}`);
    }

    @Process('send-interview-invitation')
    async handleInterviewInvitation(job: Job) {
        const { candidateEmail, candidateName, startTime, meetLink, title } = job.data;

        const formattedDate = new Date(startTime).toLocaleString('vi-VN');

        console.log(`[Worker] Tiến hành gửi thư mời phỏng vấn cho: ${candidateEmail}...`);

        // Nhờ dùng this.mailerService, giờ đây thuộc tính 'template' và 'context' mới hoạt động đúng
        await this.mailerService.sendMail({
            to: candidateEmail,
            subject: `[Thư mời phỏng vấn] - ${title}`,
            template: './interview-invitation', // Nó sẽ tự động tìm file .hbs theo cấu hình ở app.module
            context: {
                name: candidateName,
                time: formattedDate,
                link: meetLink,
            },
        });

        console.log(`[Worker] ✅ Đã gửi thư mời phỏng vấn THÀNH CÔNG tới: ${candidateEmail}`);
    }

    @Process('send-reschedule-invitation')
    async handleRescheduleInvitation(job: Job) {
        const { candidateEmail, candidateName, startTime, meetLink, title } = job.data;
        const formattedDate = new Date(startTime).toLocaleString('vi-VN');

        await this.mailerService.sendMail({
            to: candidateEmail,
            subject: `[Cập nhật lịch] - Thay đổi thời gian phỏng vấn: ${title}`,
            template: './interview-reschedule', // Tên file template mới
            context: { name: candidateName, time: formattedDate, link: meetLink },
        });
    }

    @Process('send-cancel-invitation')
    async handleCancelInvitation(job: Job) {
        const { candidateEmail, candidateName, title } = job.data;

        await this.mailerService.sendMail({
            to: candidateEmail,
            subject: `[Thông báo hủy] - Hủy lịch phỏng vấn: ${title}`,
            template: './interview-cancel', // Tên file template mới
            context: { name: candidateName, title: title },
        });
    }
}