/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationService } from 'src/services/application.service';
import { NotificationsService } from 'src/notification/notification.service';
import { ApplicationStatus } from 'src/common/enum';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/common/enum';

@Injectable()
export class InterviewListener {
  private readonly logger = new Logger(InterviewListener.name);
  constructor(
    private applicationService: ApplicationService,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private userService: UserService,
  ) { }

  @OnEvent('interview.scheduled')
  async handleInterviewScheduledEvent(payload: any) {
    try {
      // 1. Auto-update Application Status
      await this.applicationService.changeStatus(
        payload.applicationId,
        ApplicationStatus.INTERVIEW_SCHEDULED,
      );

      // 2. Save Notification to Database
      const savedNotif = await this.notificationsService.create({
        userId: payload.userId,
        title: 'Interview Scheduled',
        message: `System has scheduled an interview for ${payload.candidateName}`,
        type: 'SUCCESS',
        linkUrl: `/hr-portal/interviews`,
      });
      // 3. Emit event to Socket Gateway (for real-time frontend update)
      this.eventEmitter.emit('notification.send', savedNotif);
      this.logger.log(
        `Successfully processed scheduled event for Application ID: ${payload.applicationId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error processing interview.scheduled event: ${error.message}`,
      );
    }
  }

  @OnEvent('interview.rescheduled')
  async handleInterviewRescheduled(payload: any) {
    try {
      const savedNotif = await this.notificationsService.create({
        userId: payload.userId,
        title: 'Interview Rescheduled',
        message: `Interview with ${payload.candidateName} has been rescheduled to ${new Date(payload.newTime).toLocaleString()}.`,
        type: 'INFO',
        linkUrl: `/hr-portal/interviews`,
      });

      this.eventEmitter.emit('notification.send', savedNotif);
    } catch (error: any) {
      this.logger.error(
        `Error processing interview.rescheduled event: ${error.message}`,
      );
    }
  }

  @OnEvent('interview.cancelled')
  async handleInterviewCancelled(payload: any) {
    try {
      const savedNotif = await this.notificationsService.create({
        userId: payload.userId,
        title: 'Interview Cancelled',
        message: `Interview with ${payload.candidateName} has been cancelled.`,
        type: 'WARNING', // Warning type to highlight cancellation
        linkUrl: `/hr-portal/interviews`,
      });

      this.eventEmitter.emit('notification.send', savedNotif);
    } catch (error: any) {
      this.logger.error(
        `Error processing interview.cancelled event: ${error.message}`,
      );
    }
  }

  @OnEvent('interview.result_submitted')
  async handleInterviewResultSubmitted(payload: any) {
    console.log('[DEBUG] Event Payload:', payload);
    try {
      const targetUserIds = new Set<number | string>();

      if (payload.targetHrId) {
        targetUserIds.add(payload.targetHrId);
      }

      const superAdmins = await this.userService.findByRole(UserRole.SUPER_ADMIN);
      if (superAdmins && superAdmins.length > 0) {
        superAdmins.forEach(admin => targetUserIds.add(admin.id));
      }

      for (const userId of Array.from(targetUserIds)) {
        const savedNotif = await this.notificationsService.create({
          userId: userId,
          title: 'Interview Result Submitted',
          message: `Interviewer ${payload.interviewerName} has submitted the result (${payload.vote}) for candidate ${payload.candidateName}.`,
          type: payload.vote === 'Pass' ? 'SUCCESS' : 'WARNING',
          linkUrl: `/hr-portal/interviews`,
        });

        this.eventEmitter.emit('notification.send', savedNotif);
      }

      this.logger.log(`Successfully processed result_submitted for Interview ID: ${payload.interviewId}`);
    } catch (error: any) {
      this.logger.error(`Error processing interview.result_submitted event: ${error.message}`);
    }
  }
}
