import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Get,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { InterviewService } from '../services/interview.service';
import { InterviewCreateDto } from '../dto/interview-create.dto';
import { InterviewRescheduleDto } from '../dto/interview-reschedule.dto';
import { InterviewUpdateStatusDto } from '../dto/interview-update-status.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class SubmitResultDto {
  @IsString()
  @IsIn(['Pass', 'Fail'])
  vote: 'Pass' | 'Fail';

  @IsString()
  @IsNotEmpty()
  feedback: string;
}

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() data: InterviewUpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.interviewService.updateStatus(id, data.status);
    return {
      statusCode: 200,
      message: `Interview status updated to ${data.status}`,
      data: result,
    };
  }

  @Get()
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  async findAll(@Query() query: any) {
    const data = await this.interviewService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load interviews',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const data = await this.interviewService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch(':id/result')
  async submitResult(
    @Param('id') id: string,
    @Body() data: SubmitResultDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.interviewService.submitResult(
      id,
      user.userId,
      user.employeeId,
      data.vote,
      data.feedback,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Interview result submitted successfully',
      data: result,
    };
  }
}
