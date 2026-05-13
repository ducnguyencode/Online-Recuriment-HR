/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);
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

  async createMeeting(
    summary: string,
    description: string,
    startTime: string,
    endTime: string,
    attendeeEmails: string[] = []
  ) {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

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
        attendees: attendeeEmails.map(email => ({ email })),
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      return {
        hangoutLink: response.data.hangoutLink,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      this.logger.error('Google Meet create error', error as Error);
      throw new InternalServerErrorException(
        'Cannot create interview on Google Calendar',
      );
    }
  }

  async updateMeeting(
    eventId: string,
    summary: string,
    description: string,
    startTime: string,
    endTime: string,
  ) {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: {
          summary: summary,
          description: description,
          start: { dateTime: startTime, timeZone: 'Asia/Ho_Chi_Minh' },
          end: { dateTime: endTime, timeZone: 'Asia/Ho_Chi_Minh' },
        },
        sendUpdates: 'all',
      });
      return true;
    } catch (error) {
      this.logger.error('Google Meet update error', error as Error);
      throw new InternalServerErrorException(
        'Cannot update interview on Google Calendar',
      );
    }
  }

  async deleteMeeting(eventId: string) {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });
      return true;
    } catch (error) {
      this.logger.error('Google Meet cancel error', error as Error);
      throw new InternalServerErrorException(
        'Cannot cancel interview on Google Calendar',
      );
    }
  }
}
