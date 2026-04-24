import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { InterviewerAvailabilityService } from '../services/interviewer-availability.service';
import { AvailabilityCreateDto } from '../dto/availability-create.dto';

@Controller('interviewer-availability')
export class InterviewerAvailabilityController {
  constructor(private availabilityService: InterviewerAvailabilityService) {}

  @Post()
  async create(@Body() dto: AvailabilityCreateDto) {
    const data = await this.availabilityService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Availability slot registered successfully',
      data,
    };
  }

  @Get()
  async getByEmployee(@Query('employeeId') employeeId: string) {
    const data = await this.availabilityService.findByEmployee(employeeId);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.availabilityService.delete(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Slot removed',
    };
  }
}
