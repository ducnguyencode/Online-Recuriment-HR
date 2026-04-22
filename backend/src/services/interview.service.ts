import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '../entities/interview.entity';
import { Application } from '../entities/application.entity';
import { InterviewCreateDto } from '../dto/interview.create.dto';
import { GoogleMeetService } from './google-meet.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InterviewService {
    constructor(
        @InjectRepository(Interview)
        private interviewRepo: Repository<Interview>,
        @InjectRepository(Application)
        private appRepo: Repository<Application>,
        private googleMeetService: GoogleMeetService,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(data: InterviewCreateDto) {
        // 1. Kiểm tra đơn ứng tuyển có tồn tại không
        const application = await this.appRepo.findOne({
            where: { id: data.applicationId },
            relations: ['applicant'],
        });

        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

        // 2. Gọi sang Google để lấy link Meet
        const googleEvent = await this.googleMeetService.createMeeting(
            data.title,
            data.description || '',
            data.startTime,
            data.endTime,
        );

        // 3. Lưu vào Database nội bộ
        const interview = this.interviewRepo.create({
            title: data.title,
            description: data.description || '',
            application: application,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            googleMeetLink: googleEvent.hangoutLink || '',
            googleCalendarEventId: googleEvent.eventId || '',
        });

        const savedInterview = await this.interviewRepo.save(interview);

        this.eventEmitter.emit('interview.scheduled', {
            interviewId: savedInterview.id,
            applicationId: savedInterview.application.id,
            candidateEmail: savedInterview.application.applicant.email,
            candidateName: savedInterview.application.applicant.fullName,
            startTime: savedInterview.startTime,
            meetLink: savedInterview.googleMeetLink,
            title: savedInterview.title
        });

        return savedInterview;
    }

    // Thêm hàm dời lịch
    async reschedule(id: number, startTime: string, endTime: string, title: string, description?: string) {
        const interview = await this.interviewRepo.findOne({ where: { id }, relations: ['application', 'application.applicant'] });
        if (!interview) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');

        // 1. Cập nhật trên Google Calendar trước
        if (interview.googleCalendarEventId) {
            await this.googleMeetService.updateMeeting(
                interview.googleCalendarEventId,
                title,
                description || interview.description,
                startTime,
                endTime
            );
        }

        // 2. Nếu Google OK, mới cập nhật dưới Database
        interview.startTime = new Date(startTime);
        interview.endTime = new Date(endTime);
        interview.title = title;
        if (description) interview.description = description;

        const updatedInterview = await this.interviewRepo.save(interview);

        this.eventEmitter.emit('interview.rescheduled', {
            candidateEmail: updatedInterview.application.applicant.email,
            candidateName: updatedInterview.application.applicant.fullName,
            startTime: updatedInterview.startTime,
            meetLink: updatedInterview.googleMeetLink,
            title: updatedInterview.title
        });

        return updatedInterview;
    }

    // Thêm hàm hủy lịch
    async cancel(id: number) {
        const interview = await this.interviewRepo.findOne({ where: { id }, relations: ['application', 'application.applicant'] });
        if (!interview) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');

        // 1. Xóa trên Google Calendar
        if (interview.googleCalendarEventId) {
            await this.googleMeetService.deleteMeeting(interview.googleCalendarEventId);
        }

        this.eventEmitter.emit('interview.cancelled', {
            candidateEmail: interview.application.applicant.email,
            candidateName: interview.application.applicant.fullName,
            title: interview.title
        });

        // 2. Xóa trong Database
        await this.interviewRepo.remove(interview);
        return { message: 'Đã hủy lịch phỏng vấn thành công' };
    }
}