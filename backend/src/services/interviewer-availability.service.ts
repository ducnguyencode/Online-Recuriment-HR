import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewerAvailability } from '../entities/interviewer-availability.entity';
import { AvailabilityCreateDto } from '../dto/availability-create.dto';

@Injectable()
export class InterviewerAvailabilityService {
  constructor(
    @InjectRepository(InterviewerAvailability)
    private availabilityRepo: Repository<InterviewerAvailability>,
  ) { }

  async findByEmployee(employeeId: string) {
    return await this.availabilityRepo.find({
      where: { employeeId },
      order: { availableDate: 'ASC', startTime: 'ASC' },
    });
  }

}
