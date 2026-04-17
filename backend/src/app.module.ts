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
import { NotificationGateway } from './gateways/notification.gateway';
import { BullModule } from '@nestjs/bull';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProcessor } from './processors/email.processor';
import { DevToolsController } from './controller/dev-tools.controller';
import { User } from './entities/user.entity';
import { LoginHistory } from './entities/login-history.entity';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    EventEmitterModule.forRoot(),

    // Kết nối tới Cỗ máy Redis trong Docker của bạn
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
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
        synchronize: configService.get<string>('DB_SYNC') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([Vacancy, Department, Application, Applicant, CV, User, LoginHistory]),
    AuthModule,
  ],
  controllers: [
    VacancyController,
    DepartmentController,
    ApplicantController,
    CvController,
    ApplicationController,
    DevToolsController,
    UsersController,
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
    EmailProcessor,
    UsersService,
  ],
})
export class AppModule { }
