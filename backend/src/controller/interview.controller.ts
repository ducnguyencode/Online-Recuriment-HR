import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InterviewService } from '../services/interview.service';
import { InterviewCreateDto } from '../dto/interview-create.dto';
import { InterviewRescheduleDto } from '../dto/interview-reschedule.dto';
import { InterviewUpdateStatusDto } from '../dto/interview-update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { Roles } from 'src/auth/roles.decorator';
import { USER_ROLES } from 'src/auth/role.constants';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.interviewService.findAll(status, date, search);
    return { statusCode: 200, message: 'Success', data: { items: data } };
  }

  @Get(':id')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async findById(@Param('id') id: string) {
    const data = await this.interviewService.findById(id);
    return { statusCode: 200, message: 'Success', data };
  }

  @Post()
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async create(
    @Body() data: InterviewCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.interviewService.create(data, user.userId);
    return {
      statusCode: 201,
      message: 'Interview scheduled successfully',
      data: result,
    };
  }

  @Patch(':id/reschedule')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async reschedule(
    @Param('id') id: string,
    @Body() data: InterviewRescheduleDto,
  ) {
    const result = await this.interviewService.reschedule(
      id,
      data.startTime,
      data.endTime,
      data.title,
      data.description,
    );
    return {
      statusCode: 200,
      message: 'Interview rescheduled successfully',
      data: result,
    };
  }

  @Patch(':id/status')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async updateStatus(
    @Param('id') id: string,
    @Body() data: InterviewUpdateStatusDto,
  ) {
    const result = await this.interviewService.updateStatus(id, data.status);
    return {
      statusCode: 200,
      message: `Interview status updated to ${data.status}`,
      data: result,
    };
  }

  @Patch(':id/result')
  @Roles(USER_ROLES.INTERVIEWER, USER_ROLES.HR, USER_ROLES.SUPERADMIN)
  async submitResult(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { vote: 'Pass' | 'Fail'; feedback: string },
  ) {
    const data = await this.interviewService.submitResult(
      id,
      String(user.userId),
      body.vote,
      body.feedback,
    );
    return {
      statusCode: 200,
      message: 'Interview result submitted successfully',
      data,
    };
  }
}
