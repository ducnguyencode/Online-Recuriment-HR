import { InjectRedis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ApplicationStatusAccess } from 'src/common/decorator/application-status-access.decorator';
import { CurrentUser, Roles } from 'src/common/decorator/decorator';
import { ApplicationStatus, UserRole } from 'src/common/enum';
import { ApplicationStatusPolicyGuard } from 'src/common/guards/application-status-policy.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { Application } from 'src/entities/application.entity';
import { User } from 'src/entities/user.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicationService } from 'src/services/application.service';
import {
  APPLICATION_APPLY_JOB,
  APPLICATION_APPLY_QUEUE,
} from 'src/services/bullmq/application-apply-worker/application-apply-worker.constants';

@Controller('application')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
  constructor(
    @InjectQueue(APPLICATION_APPLY_QUEUE)
    private applicationApplyQueue: Queue<ApplicationCreateDto>,
    @InjectRedis() private readonly redis: Redis,
    private applicationService: ApplicationService,
  ) {}

  @Post('create')
  @Roles(UserRole.APPLICANT, UserRole.HR, UserRole.SUPER_ADMIN)
  async create(@Body() applicationCreateDto: ApplicationCreateDto) {
    const data = await this.applicationService.create(applicationCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a application',
      data,
    };
  }

  @Post('applicant-create')
  async applicantCreate(@Body() applicationCreateDto: ApplicationCreateDto) {
    await this.applicationService.checkDuplicate(
      applicationCreateDto.applicantId,
      applicationCreateDto.vacancyId,
    );
    const key = `apply-lock:${applicationCreateDto.applicantId}`;

    const locked = await this.redis.set(key, '1', 'EX', 300, 'NX');

    if (!locked) {
      const ttl = await this.redis.ttl(key);

      const minutes = Math.ceil(ttl / 60);
      const seconds = ttl % 60;
      const limit = await this.redis.incrby(key, 1);
      if (limit > 10) {
        throw new BadRequestException(
          `Please wait ${minutes}m ${seconds}s before applying again`,
        );
      }
    }

    const { data } = await this.applicationApplyQueue.add(
      APPLICATION_APPLY_JOB,
      applicationCreateDto,
      { removeOnComplete: true, removeOnFail: false },
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a application',
      data,
    };
  }

  @Get()
  @Roles(
    UserRole.HR,
    UserRole.INTERVIEWER,
    UserRole.SUPER_ADMIN,
    UserRole.APPLICANT,
  )
  async findAll(
    @Query() query: ApplicationFindDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<FindResponseDto<Application>>> {
    // Applicants can only view their own applications
    if (user.role === UserRole.APPLICANT) {
      query.applicantId = user.applicantId;
    }
    const data = await this.applicationService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load applications',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  async findById(@Param('id') id: number) {
    try {
      return await this.applicationService.findById(id);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard, ApplicationStatusPolicyGuard, RolesGuard)
  @ApplicationStatusAccess({ allowSameStatus: false })
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  @Patch('change-status')
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  async changeStatus(
    @Query('id') id: number,
    @Query('status') status: ApplicationStatus,
  ): Promise<ApiResponse<Application>> {
    const data = await this.applicationService.changeStatus(id, status);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change application status',
      data: data,
    };
  }
}
