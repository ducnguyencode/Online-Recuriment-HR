import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleMeetService {
    private oauth2Client;

    constructor(private configService: ConfigService) {
        this.oauth2Client = new google.auth.OAuth2(
            this.configService.get<string>('GOOGLE_CLIENT_ID'),
            this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        );
        this.oauth2Client.setCredentials({
            refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
        });
    }

    async createMeeting(summary: string, description: string, startTime: string, endTime: string) {
        try {
            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const event = {
                summary: summary,
                description: description,
                start: {
                    dateTime: startTime,
                    timeZone: 'Asia/Ho_Chi_Minh',
                },
                end: {
                    dateTime: endTime,
                    timeZone: 'Asia/Ho_Chi_Minh',
                },

                conferenceData: {
                    createRequest: {
                        requestId: `interview-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
                attendees: [],
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
            });

            return {
                hangoutLink: response.data.hangoutLink,
                eventId: response.data.id,
                htmlLink: response.data.htmlLink,
            };
        } catch (error) {
            console.error('Lỗi khi tạo Google Meet:', error);
            throw new InternalServerErrorException('Không thể tạo lịch phỏng vấn trên Google Calendar');
        }
    }

    async updateMeeting(eventId: string, summary: string, description: string, startTime: string, endTime: string) {
        try {
            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: {
                    summary: summary,
                    description: description,
                    start: { dateTime: startTime, timeZone: 'Asia/Ho_Chi_Minh' },
                    end: { dateTime: endTime, timeZone: 'Asia/Ho_Chi_Minh' },
                },
            });
            return true;
        } catch (error) {
            console.error('Lỗi khi cập nhật Google Meet:', error);
            throw new InternalServerErrorException('Không thể cập nhật lịch trên Google Calendar');
        }
    }

    async deleteMeeting(eventId: string) {
        try {
            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa Google Meet:', error);
            throw new InternalServerErrorException('Không thể hủy lịch trên Google Calendar');
        }
    }
}