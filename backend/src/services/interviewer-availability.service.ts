import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { InterviewerAvailability } from '../entities/interviewer-availability.entity';

@Injectable()
export class InterviewerAvailabilityService {
  constructor(
    @InjectRepository(InterviewerAvailability)
    private availabilityRepo: Repository<InterviewerAvailability>,
  ) { }

  async findByEmployee(employeeId: string) {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const todayString = localDate.toISOString().split('T')[0];

    return await this.availabilityRepo.find({
      where: { employeeId, availableDate: MoreThanOrEqual(todayString as any), },
      order: { availableDate: 'ASC', startTime: 'ASC' },
    });
  }
}
