import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Application } from './entities/application.entity';
import { Applicant } from './entities/applicant.entity';
import { CV } from './entities/cv.entity';
import { VacanciesService } from './services/vacancies.service';
import { Vacancy } from './entities/vacancy.entity';
import { VacancyController } from './controller/vacancy.controller';
import { DepartmentController } from './controller/department.controller';
import { DepartmentService } from './services/department.service';
import { ApplicationService } from './services/application.service';
import { ApplicantService } from './services/applicant.service';
import { CvService } from './services/cv.service';
import { ApplicantController } from './controller/applicant.controller';
import { CvController } from './controller/cv.controller';
import { ApplicationController } from './controller/application.controller';
import { AiService } from './services/ai.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationGateway } from './notification/notification.gateway';
import { BullModule } from '@nestjs/bull';
import { EmailQueueService } from './services/email-queue.service';
import { DevToolsController } from './controller/dev-tools.controller';
import { GoogleMeetService } from './services/google-meet.service';
import { InterviewController } from './controller/interview.controller';
import { InterviewService } from './services/interview.service';
import { Interview } from './entities/interview.entity';
import { InterviewerPanel } from './entities/interviewer-panel.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { InAppNotification } from './entities/notification.entity';
import { Employee } from './entities/employee.entity';
import { InterviewListener } from './listeners/interview.listener';
import { AuthAuditListener } from './listeners/auth-audit.listener';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomValidator } from './common/validator/custom.validator';
import { User } from './entities/user.entity';
import { BootstrapService } from './services/bootstrap.service';
import { Seed } from './database/seed';
import { NotificationsService } from './notification/notification.service';
import { InterviewerAvailability } from './entities/interviewer-availability.entity';
import { EmployeeController } from './controller/employee.controller';
import { EmployeeService } from './services/employee.service';
import { AuthModule } from './auth/auth.module';
import { AuditLogController } from './controller/audit-log.controller';
import { NotificationsController } from './notification/notification.controller';
import { AuditService } from './services/audit.service';
import { DbCompatService } from './common/db-compat.service';
import { AdminUserController } from './controller/admin-user.controller';
import { AdminUserService } from './services/admin-user.service';
import { BrevoApiService } from './services/brevo-api.service';
import { AuditInterceptor } from './common/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host =
          configService.get<string>('BREVO_SMTP_HOST') ??
          configService.get<string>('SMTP_HOST');
        const port = Number(
          configService.get<string>('BREVO_SMTP_PORT') ??
            configService.get<string>('SMTP_PORT') ??
            587,
        );
        const brevoApiKey =
          configService.get<string>('BREVO_API_KEY')?.trim() ?? '';
        const user =
          configService.get<string>('BREVO_SMTP_USER')?.trim() ||
          configService.get<string>('SMTP_USER')?.trim();
        const pass =
          configService.get<string>('BREVO_SMTP_PASS')?.trim() ||
          configService.get<string>('SMTP_PASS')?.trim() ||
          (brevoApiKey.startsWith('xsmtpsib-') ? brevoApiKey : '');
        const from =
          configService.get<string>('BREVO_FROM_EMAIL') ??
          configService.get<string>('SMTP_FROM') ??
          '"HR Recruitment" <noreply@example.com>';
        return {
          transport: {
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
          },
          defaults: {
            from,
          },
          template: {
            dir: join(__dirname, 'mail', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNC') !== 'false',
      }),
    }),
    TypeOrmModule.forFeature([
      Vacancy,
      Department,
      Application,
      Applicant,
      CV,
      User,
      Employee,
      Interview,
      InterviewerPanel,
      InterviewerAvailability,
      InAppNotification,
      ActivityLog,
    ]),
  ],
  controllers: [
    VacancyController,
    DepartmentController,
    ApplicantController,
    CvController,
    ApplicationController,
    DevToolsController,
    InterviewController,
    EmployeeController,
    AuditLogController,
    NotificationsController,
    AdminUserController,
  ],
  providers: [
    VacanciesService,
    DepartmentService,
    ApplicationService,
    ApplicantService,
    CvService,
    AiService,
    NotificationGateway,
    EmailQueueService,
    GoogleMeetService,
    InterviewService,
    InterviewListener,
    AuthAuditListener,
    CustomValidator,
    BootstrapService,
    Seed,
    NotificationsService,
    EmployeeService,
    AuditService,
    DbCompatService,
    AdminUserService,
    BrevoApiService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
