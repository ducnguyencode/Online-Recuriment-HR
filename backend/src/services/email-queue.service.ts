/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailQueueService {
  // Tiêm (Inject) cái bảng Hàng đợi có tên 'email-queue' vào đây
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  // Lắng nghe sự kiện mà chúng ta đã dặn Dev 2 bắn ra
  @OnEvent('application.submitted')
  async handleApplicationSubmitted(payload: any) {
    console.log(
      `[Queue] Bắt được sự kiện nộp CV của ${payload.candidateName}! Đang đẩy vào hàng đợi Redis...`,
    );

    // Ném công việc tên là 'send-thank-you' vào Queue
    await this.emailQueue.add('send-thank-you', payload, {
      attempts: 3, // Nếu mạng Brevo bị lag gửi lỗi, tự động thử lại 3 lần
      backoff: 5000, // Mỗi lần thử lại cách nhau 5 giây
      removeOnComplete: true, // Gửi xong thì xóa khỏi Redis cho nhẹ máy
    });
  }
}
