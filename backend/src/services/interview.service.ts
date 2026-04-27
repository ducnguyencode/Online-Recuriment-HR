/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  EntityManager,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Entities
import { Interview } from '../entities/interview.entity';
import { Application } from '../entities/application.entity';
import { InterviewerPanel } from '../entities/interviewer-panel.entity';
import { InterviewerAvailability } from '../entities/interviewer-availability.entity';
import { EmailQueue } from '../entities/email-queue.entity';

// Services & DTOs
import { GoogleMeetService } from './google-meet.service';
import { InterviewCreateDto } from '../dto/interview-create.dto';
import { ApplicantStatus, ApplicationStatus, InterviewStatus } from 'src/common/enum';

@Injectable()
export class InterviewService {
  constructor(
    // Inject DataSource to handle Database Transactions
    private dataSource: DataSource,

    @InjectRepository(Interview)
    private interviewRepo: Repository<Interview>,

    @InjectRepository(Application)
    private appRepo: Repository<Application>,

    // Inject other services
    private googleMeetService: GoogleMeetService,
    private eventEmitter: EventEmitter2,
  ) { }

  // HELPER METHOD: Check Availability & Save Slot
  // We pass 'EntityManager' so this runs inside the transaction
  private async checkAndSaveAvailability(
    manager: EntityManager,
    empId: string,
    start: Date,
    end: Date,
  ): Promise<void> {
    const dateStr = start.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const startTimeStr = start.toTimeString().split(' ')[0]; // Format: HH:mm:ss
    const endTimeStr = end.toTimeString().split(' ')[0]; // Format: HH:mm:ss

    const existingSlot = await manager.createQueryBuilder(InterviewerAvailability, 'slot')
      .where('slot.employeeId = :empId', { empId })
      .andWhere('slot.availableDate = :date', { date: dateStr })
      .andWhere('slot.startTime < :end', { end: endTimeStr })
      .andWhere('slot.endTime > :start', { start: startTimeStr })
      .getOne();

    if (existingSlot) {
      throw new ConflictException(
        `This interview is overlapping with another interview from ${startTimeStr} to ${endTimeStr}.`
      );
    }

    const newSlot = manager.create(InterviewerAvailability, {
      employeeId: empId,
      availableDate: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      isBooked: true,
    });
    await manager.save(newSlot);
  }

  // CREATE INTERVIEW
  async create(data: InterviewCreateDto, userId: number) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const now = new Date();

    // 1. Basic time validation
    if (start <= now)
      throw new BadRequestException('Start time must be in the future.');
    if (end <= start)
      throw new BadRequestException('End time must be after start time.');

    // 2. Initialize Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Validate Application (Inside transaction)
      const application = await queryRunner.manager.findOne(Application, {
        where: { id: data.applicationId },
        relations: ['applicant', 'applicant.user'], // Need applicant info for the email queue
      });

      if (
        !application ||
        ['Selected', 'Rejected'].includes(application.status)
      ) {
        throw new NotFoundException(
          'Application not found or no longer eligible for interview.',
        );
      }

      // 4. Extract Panel IDs and Lock Availability
      await this.checkAndSaveAvailability(
        queryRunner.manager,
        data.interviewerId,
        start,
        end,
      );

      // 5. Generate Google Meet Link (External API call)
      const googleEvent = await this.googleMeetService.createMeeting(
        data.title,
        data.description || '',
        data.startTime,
        data.endTime,
      );

      // 6. Save Interview Record
      const newInterview = new Interview();

      // Assign the relation and properties directly
      newInterview.application = application; // Or use: newInterview.applicationId = application.id;
      newInterview.title = data.title;
      newInterview.description = data.description || '';
      newInterview.startTime = start;
      newInterview.endTime = end;
      newInterview.meetPlatform = 'GoogleMeet';
      newInterview.meetLink = googleEvent.hangoutLink || '';
      newInterview.googleCalendarEventId = googleEvent.eventId || '';
      newInterview.status = InterviewStatus.SCHEDULED;

      const savedInterview = await queryRunner.manager.save(newInterview);

      // 7. Save Interviewer Panel Records
      const panelRecord = queryRunner.manager.create(InterviewerPanel, {
        interviewId: savedInterview.id,
        employeeId: data.interviewerId,
        vote: 'Pending',
      });
      await queryRunner.manager.save(InterviewerPanel, panelRecord);

      // 8. Queue the Invitation Email
      const emailRecord = queryRunner.manager.create(EmailQueue, {
        recipientEmail: application.applicant.email,
        subject: `Interview Invitation: ${data.title}`,
        bodyHtml: `
          <p>Dear ${application.applicant.fullName},</p>
          <p>Your interview is scheduled for <strong>${start.toLocaleString()}</strong>.</p>
          <p>Please join the meeting using the following link: <br>
          <a href="${googleEvent.hangoutLink}">${googleEvent.hangoutLink}</a></p>
        `,
        emailType: 'Invite',
        status: 'Pending',
      });
      await queryRunner.manager.save(emailRecord);

      // 9. Commit the transaction (All database operations succeed together)
      await queryRunner.commitTransaction();

      // 10. Emit event for real-time notifications (WebSockets)
      // We emit this AFTER the transaction is fully committed to ensure data consistency
      const completeInterview = await this.interviewRepo.findOne({
        where: { id: savedInterview.id },
        relations: [
          'application',
          'application.applicant',
          'application.applicant.user',
          'panels',
          'panels.employee',
          'panels.employee.user'
        ]
      });

      if (completeInterview) {
        this.eventEmitter.emit('interview.scheduled', {
          hrId: userId,
          interviewId: completeInterview.id,
          applicationId: completeInterview.application?.id,
          candidateName: completeInterview.application?.applicant?.fullName,
          title: completeInterview.title,
          userId: completeInterview.panels[0]?.employee?.user?.id,
        });
      }

      return completeInterview || savedInterview;
    } catch (err) {
      // ROLLBACK: If anything above fails (DB error, Google API error, Conflict),
      // we revert all database changes made within this transaction.
      await queryRunner.rollbackTransaction();

      // OPTIONAL BUT RECOMMENDED: Cleanup Google Calendar if DB failed AFTER meeting creation
      if (
        err &&
        !(err instanceof ConflictException) &&
        !(err instanceof BadRequestException)
      ) {
        // If we suspect a DB failure after Google API success, we should try to delete the orphaned meeting
        // Note: This requires extracting the eventId safely, which might need custom error handling logic.
        console.error(
          'Transaction failed. Generating rollback for potential orphaned Google Meet event.',
        );
      }

      throw err; // Re-throw to let the Controller handle the HTTP response
    } finally {
      // Always release the query runner connection back to the pool
      await queryRunner.release();
    }
  }

  // RESCHEDULE INTERVIEW
  async reschedule(
    id: string,
    startTime: string,
    endTime: string,
    title: string,
    description?: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now)
      throw new BadRequestException('Start time must be in the future.');
    if (end <= start)
      throw new BadRequestException('End time must be after start time.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch existing interview with necessary relations
      const interview = await queryRunner.manager.findOne(Interview, {
        where: { id },
        relations: [
          'application',
          'application.applicant',
          'application.applicant.user',
          'panels',
        ],
      });

      if (!interview) throw new NotFoundException('Interview not found.');
      const panelIds = interview.panels.map((p) => p.employeeId);
      if (panelIds.length > 0) {
        const oldDateStr = interview.startTime.toISOString().split('T')[0];
        const oldStartStr = interview.startTime.toTimeString().split(' ')[0];
        const oldEndStr = interview.endTime.toTimeString().split(' ')[0];

        await queryRunner.manager.delete(InterviewerAvailability, {
          employeeId: panelIds[0],
          availableDate: oldDateStr,
          startTime: oldStartStr,
          endTime: oldEndStr
        });

        await this.checkAndSaveAvailability(
          queryRunner.manager,
          panelIds[0],
          start,
          end,
        );
      }

      // 3. Update Google Calendar (External API)
      if (interview.googleCalendarEventId) {
        await this.googleMeetService.updateMeeting(
          interview.googleCalendarEventId,
          title,
          description || interview.description,
          startTime,
          endTime,
        );
      }

      // 4. Update Database Entity
      interview.startTime = start;
      interview.endTime = end;
      interview.title = title;
      interview.status = InterviewStatus.SCHEDULED;
      if (description !== undefined) {
        interview.description = description;
      }

      const updatedInterview = await queryRunner.manager.save(interview);

      // 5. Queue the Reschedule Notification Email
      const emailRecord = new EmailQueue();
      emailRecord.recipientEmail = interview.application.applicant.email;
      emailRecord.subject = `Update: Your interview has been rescheduled - ${title}`;
      emailRecord.bodyHtml = `
        <p>Dear ${interview.application.applicant.fullName},</p>
        <p>Please note that your interview time has been updated to <strong>${start.toLocaleString()}</strong>.</p>
        <p>Meeting Link: <a href="${interview.meetLink}">${interview.meetLink}</a></p>
      `;
      emailRecord.emailType = 'Invite';
      emailRecord.status = 'Pending';

      await queryRunner.manager.save(emailRecord);

      // 6. Commit the transaction
      await queryRunner.commitTransaction();

      // 7. Emit WebSocket event
      this.eventEmitter.emit('interview.rescheduled', {
        hrId: 'current-user-id', // Replace with dynamic user ID from controller
        candidateName: interview.application.applicant.fullName,
        title: updatedInterview.title,
        newTime: start,
      });

      return updatedInterview;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // UPDATE INTERVIEW STATUS (e.g., CANCEL, COMPLETE)
  async updateStatus(id: string, status: InterviewStatus) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const interview = await queryRunner.manager.findOne(Interview, {
        where: { id },
        relations: [
          'application',
          'application.applicant',
          'application.applicant.user',
          'panels',
        ],
      });

      if (!interview) throw new NotFoundException('Interview not found.');

      interview.status = status;
      await queryRunner.manager.save(Interview, interview);

      if (status === InterviewStatus.CANCELLED && interview.application) {
        interview.application.status = ApplicationStatus.PENDING;
        await queryRunner.manager.save(Application, interview.application);
        // 1. Delete Google Calendar Event (Fail-safe try-catch)
        if (interview.googleCalendarEventId) {
          try {
            await this.googleMeetService.deleteMeeting(
              interview.googleCalendarEventId,
            );
          } catch (error) {
            console.error(
              '[Google Meet] Failed to delete event, continuing DB update:',
              error,
            );
          }
        }

        // 2. Release HR Availability Slots
        const panelIds = interview.panels.map((p) => p.employeeId);
        if (panelIds.length > 0) {
          const dateStr = interview.startTime.toISOString().split('T')[0];
          const oldStartStr = interview.startTime.toTimeString().split(' ')[0];
          const oldEndStr = interview.endTime.toTimeString().split(' ')[0];

          await queryRunner.manager.delete(InterviewerAvailability, {
            employeeId: In(panelIds),
            availableDate: dateStr,
            startTime: oldStartStr,
            endTime: oldEndStr
          });
        }

        // 3. Queue Cancellation Email
        const emailRecord = new EmailQueue();
        emailRecord.recipientEmail = interview.application.applicant.email;
        emailRecord.subject = `Interview Cancelled: ${interview.title}`;
        emailRecord.bodyHtml = `
          <p>Dear ${interview.application.applicant.fullName},</p>
          <p>We regret to inform you that your interview scheduled for <strong>${interview.startTime.toLocaleString()}</strong> has been cancelled.</p>
          <p>Our HR team will be in touch with you shortly.</p>
        `;
        emailRecord.emailType = 'Result';
        emailRecord.status = 'Pending';

        await queryRunner.manager.save(emailRecord);
      }

      // Update the status and save
      interview.status = status;
      const savedInterview = await queryRunner.manager.save(interview);

      await queryRunner.commitTransaction();

      // Emit event for real-time notifications
      if (status === InterviewStatus.CANCELLED) {
        this.eventEmitter.emit('interview.cancelled', {
          hrId: 'current-user-id',
          candidateName: interview.application.applicant.fullName,
          title: interview.title,
        });
      }

      return savedInterview;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: any) {
    const { status, search, page = 1, limit = 10, employeeId } = query;

    const whereCondition: any = {};
    if (status) whereCondition.status = status;

    if (employeeId) {
      whereCondition.panels = { employeeId: employeeId };
    }

    const [items, totalItems] = await this.interviewRepo.findAndCount({
      where: whereCondition,
      relations: [
        'application',
        'application.applicant',
        'application.applicant.user',
        'application.vacancy',
        'panels',
        'panels.employee',
        'panels.employee.user',
      ],
      order: { startTime: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
    };
  }

  async findOne(id: string) {
    const interview = await this.interviewRepo.findOne({
      where: { id },
      relations: [
        'application',
        'application.applicant',
        'application.applicant.user',
        'application.vacancy',
        'panels',
        'panels.employee',
        'panels.employee.user',
      ],
    });

    if (!interview)
      throw new NotFoundException('Không tìm thấy buổi phỏng vấn');
    return interview;
  }

  // SUBMIT INTERVIEW RESULT (VOTE & FEEDBACK)
  async submitResult(interviewId: string, userId: number | string, employeeId: string | undefined, vote: 'Pass' | 'Fail', feedback: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const interview = await queryRunner.manager.findOne(Interview, {
        where: { id: interviewId },
        relations: ['panels', 'panels.employee', 'application', 'panels.employee.user', 'application.applicant']
      });

      if (!interview) throw new NotFoundException('Interview not found.');

      const myPanel = interview.panels[0];
      myPanel.vote = vote;
      myPanel.feedback = feedback;
      await queryRunner.manager.save(InterviewerPanel, myPanel);

      interview.status = InterviewStatus.COMPLETED;
      await queryRunner.manager.save(Interview, interview);

      if (interview.application) {
        if (vote === 'Pass') {
          interview.application.status = ApplicationStatus.SELECTED;
        } else {
          interview.application.status = ApplicationStatus.REJECTED;
          interview.application.applicant.status = ApplicantStatus.NOT_IN_PROCESS;
          await queryRunner.manager.save(interview.application.applicant);
        }
        await queryRunner.manager.save(Application, interview.application);
      }

      await queryRunner.commitTransaction();
      return myPanel;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
