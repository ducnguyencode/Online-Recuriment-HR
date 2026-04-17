import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { InterviewService } from '../services/interview.service';
import { InterviewCreateDto } from '../dto/interview.create.dto';

@Controller('interviews')
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) { }

    @Post('create')
    async create(@Body() data: InterviewCreateDto) {
        return await this.interviewService.create(data);
    }

    // API Dời lịch
    @Patch(':id/reschedule')
    async reschedule(
        @Param('id') id: number,
        @Body() data: { startTime: string; endTime: string; title: string; description?: string }
    ) {
        return await this.interviewService.reschedule(id, data.startTime, data.endTime, data.title, data.description);
    }

    // API Hủy lịch
    @Delete(':id')
    async cancel(@Param('id') id: number) {
        return await this.interviewService.cancel(id);
    }
}