import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SavedJob } from 'src/entities/saved-job.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SavedJobService {
    constructor(
        @InjectRepository(SavedJob)
        private savedJobsTable: Repository<SavedJob>,
    ) {}

    async findAllByUser(userId: number): Promise<SavedJob[]> {
        return this.savedJobsTable.find({
            where: { userId },
            relations: ['vacancy', 'vacancy.department'],
            order: { createdAt: 'DESC' },
        });
    }

    async isSaved(userId: number, vacancyId: number): Promise<boolean> {
        const count = await this.savedJobsTable.count({
            where: { userId, vacancyId },
        });
        return count > 0;
    }

    async toggle(userId: number, vacancyId: number): Promise<{ saved: boolean }> {
        const existing = await this.savedJobsTable.findOne({
            where: { userId, vacancyId },
        });

        if (existing) {
            await this.savedJobsTable.remove(existing);
            return { saved: false };
        } else {
            const savedJob = this.savedJobsTable.create({ userId, vacancyId });
            await this.savedJobsTable.save(savedJob);
            return { saved: true };
        }
    }
}
