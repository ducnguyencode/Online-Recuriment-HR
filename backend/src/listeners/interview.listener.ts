import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bull";
import { ApplicationService } from "src/services/application.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class InterviewListener {
    constructor(
        @InjectQueue('email-queue') private emailQueue: Queue,
        private applicationService: ApplicationService,
        private eventEmitter: EventEmitter2,
    ) { }

    @OnEvent('interview.scheduled')
    async handleInterviewScheduledEvent(payload: any) {
        // 1. Tự động đổi trạng thái Đơn ứng tuyển sang INTERVIEWING
        await this.applicationService.changeStatus(payload.applicationId, 'Interview Scheduled' as any);

        // 2. Đẩy job gửi mail vào hàng đợi ngầm
        await this.emailQueue.add('send-interview-invitation', payload);

        // 3. Bắn tin nhắn Socket cho HR (Real-time)
        this.eventEmitter.emit('notification.send', {
            type: 'INFO',
            message: `Hệ thống đã tự động gửi thư mời cho ${payload.candidateName}`,
            linkUrl: `/interviews/${payload.interviewId}`
        });
    }

    @OnEvent('interview.rescheduled')
    async handleInterviewRescheduled(payload: any) {
        // Chỉ cần đẩy vào hàng đợi gửi mail
        await this.emailQueue.add('send-reschedule-invitation', payload);
    }

    @OnEvent('interview.cancelled')
    async handleInterviewCancelled(payload: any) {
        await this.emailQueue.add('send-cancel-invitation', payload);
    }
}