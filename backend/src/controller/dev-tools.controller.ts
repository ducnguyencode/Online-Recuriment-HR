import { Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';

@Controller('dev-tools')
export class DevToolsController {
    // Tiêm cái "loa phát thanh" của NestJS vào đây
    constructor(private eventEmitter: EventEmitter2) { }

    @Post('trigger-notification')
    @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.ADMIN)
    triggerNotification() {
        console.log('[DevTools] Đang tạo dữ liệu giả lập để test...');

        // 1. Tạo một cục dữ liệu giả (Mock Data) bao gồm cả thông tin cho Socket và Email
        const mockPayload = {
            // Data dành cho Worker gửi Email
            applicationId: `mock-${Date.now()}`,
            candidateEmail: 'kakalotdt@gmail.com', // ⚠️ Thay email thật của bạn vào đây
            candidateName: 'Long Tester',
            vacancyTitle: 'Senior Fullstack Developer',

            // Data dành cho Socket hiển thị thông báo
            notificationId: `notif-${Date.now()}`,
            type: 'SUCCESS',
            message: `Ứng viên Long Tester vừa nộp CV giả lập vào vị trí Senior Fullstack Developer`,
            linkUrl: `/hr-portal/applications/mock-123`,
            createdAt: new Date().toISOString()
        };

        // 2. Kích hoạt sự kiện cho phần WebSockets (Trạm phát sóng)
        this.eventEmitter.emit('notification.send', mockPayload);

        // 3. Kích hoạt sự kiện cho phần BullMQ (Gửi email ngầm)
        this.eventEmitter.emit('application.submitted', mockPayload);

        // 4. Báo cáo kết quả ra màn hình Postman
        return {
            statusCode: 200,
            message: 'Đã bắn sự kiện giả lập thành công! Hãy check tab Socket và Hòm thư Email.',
            data: mockPayload
        };
    }
}