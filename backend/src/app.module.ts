import { Module } from '@nestjs/common';
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
import { InterviewListener } from './listeners/interview.listener';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { InAppNotification } from './entities/notification.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomValidator } from './common/validator/custom.validator';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from './common/jwt.strategy';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { BootstrapService } from './services/bootstrap.service';
import { Seed } from './database/seed';
import { Employee } from './entities/employee.entity';
import { MailService } from './services/mail.service';
import { NotificationsService } from './notification/notification.service';
import { NotificationsController } from './notification/notification.controller';
import { InterviewerPanel } from './entities/interviewer-panel.entity';
import { InterviewerAvailability } from './entities/interviewer-availability.entity';
import { EmployeeController } from './controller/employee.controller';
import { EmployeeService } from './services/employee.service';
import { EmailQueue } from './entities/email-queue.entity';
import { AdminUserController } from './controller/admin-user.controller';
import { AdminUserService } from './services/admin-user.service';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogController } from './controller/audit-log.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    MailerModule.forRootAsync({
      imports: [ConfigModule], // Import này để lấy được các biến .env
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'), // Ví dụ: smtp.gmail.com
          port: configService.get('SMTP_PORT'),
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"HR Recruitment" <noreply@example.com>',
        },
        template: {
          // Lưu ý: join(__dirname, 'mail', 'templates') nếu thư mục mail nằm trong src
          dir: join(__dirname, 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),

    EventEmitterModule.forRoot(),

    // Kết nối tới Cỗ máy Redis trong Docker của bạn
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

    // Khởi tạo Bảng công việc
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
        synchronize: true,

        // dropSchema: true,
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
      EmailQueue,
      AuditLog,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '1d' },
      }),
    }),
  ],
  controllers: [
    VacancyController,
    DepartmentController,
    ApplicantController,
    CvController,
    ApplicationController,
    DevToolsController,
    InterviewController,
    AuthController,
    EmployeeController,
    NotificationsController,
    AdminUserController,
    AuditLogController,
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
    CustomValidator,
    UserService,
    AuthService,
    BootstrapService,
    JwtStrategy,
    Seed,
    MailService,
    NotificationsService,
    EmployeeService,
    AdminUserService,
    RolesGuard,
    AuditLogService,
  ],
})
export class AppModule {}
