import {
    Controller,
    Post,
    Body,
    Patch,
    Param,
    UseGuards
} from '@nestjs/common';
import { InterviewService } from '../services/interview.service';
import { InterviewCreateDto } from '../dto/interview-create.dto';
import { InterviewRescheduleDto } from '../dto/interview-reschedule.dto';
import { InterviewUpdateStatusDto } from '../dto/interview-update-status.dto';

// Auth Guards & Decorators from Dev 1
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';

@Controller('interviews')
@UseGuards(JwtAuthGuard) // Protect all interview endpoints
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) { }

    // POST /interviews
    @Post()
    async create(
        @Body() data: InterviewCreateDto,
        @CurrentUser() user: AuthUser // Get HR info from JWT token
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
        @Body() data: InterviewRescheduleDto
    ) {
        const result = await this.interviewService.reschedule(
            id,
            data.startTime,
            data.endTime,
            data.title,
            data.description
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
        @CurrentUser() user: AuthUser
    ) {
        const result = await this.interviewService.updateStatus(id, data.status);
        return {
            statusCode: 200,
            message: `Interview status updated to ${data.status}`,
            data: result,
        };
    }
}