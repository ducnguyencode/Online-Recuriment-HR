import { Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('dev-tools')
export class DevToolsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Post('trigger-notification')
  triggerNotification() {
    console.log('[DevTools] Creating mock notification data for testing...');

    const mockPayload = {
      applicationId: `mock-${Date.now()}`,
      candidateEmail: 'kakalotdt@gmail.com',
      candidateName: 'Long Tester',
      vacancyTitle: 'Senior Fullstack Developer',

      notificationId: `notif-${Date.now()}`,
      type: 'SUCCESS',
      message: 'Long Tester submitted a mock CV for Senior Fullstack Developer.',
      linkUrl: `/hr-portal/applications/mock-123`,
      createdAt: new Date().toISOString(),
    };

    this.eventEmitter.emit('notification.send', mockPayload);
    this.eventEmitter.emit('application.submitted', mockPayload);

    return {
      statusCode: 200,
      message:
        'Mock notification event sent successfully. Check the socket tab and email inbox.',
      data: mockPayload,
    };
  }
}
