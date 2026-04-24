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

// Auth Guards & Decorators from Dev 1
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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
@UseGuards(JwtAuthGuard) // Protect all interview endpoints
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) { }

  // POST /interviews
  @Post()
  async create(
    @Body() data: InterviewCreateDto,
    @CurrentUser() user: AuthUser, // Get HR info from JWT token
  ) {
    const result = await this.interviewService.create(data, user.userId);
    return {
      statusCode: 201,
      message: 'Interview scheduled successfully',
      data: result,
    };
  }

  // PATCH /interviews/:id/reschedule
  @Patch(':id/reschedule')
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

  // PATCH /interviews/:id/status
  @Patch(':id/status')
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
  async findAll(@Query() query: any) {
    const data = await this.interviewService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load interviews',
      data,
    };
  }

  @Get(':id')
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
