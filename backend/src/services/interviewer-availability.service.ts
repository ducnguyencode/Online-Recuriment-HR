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

    async create(dto: AvailabilityCreateDto) {
        // Kiểm tra xem đã tồn tại khung giờ này cho nhân viên này chưa
        const existing = await this.availabilityRepo.findOne({
            where: {
                employeeId: dto.employeeId,
                availableDate: dto.availableDate,
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
        });

        if (existing) {
            throw new ConflictException('This availability slot already exists.');
        }

        const newSlot = this.availabilityRepo.create(dto);
        return await this.availabilityRepo.save(newSlot);
    }

    async findByEmployee(employeeId: string) {
        return await this.availabilityRepo.find({
            where: { employeeId },
            order: { availableDate: 'ASC', startTime: 'ASC' },
        });
    }

    async delete(id: string) {
        return await this.availabilityRepo.delete(id);
    }
}