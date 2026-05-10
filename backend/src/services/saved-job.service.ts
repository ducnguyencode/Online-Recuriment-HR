import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { SavedJob } from 'src/entities/saved-job.entity';
import { Repository } from 'typeorm';

export interface AdminFavoriteJob {
    id: string;
    applicant: { id: string; fullName: string; email: string; phone: string };
    vacancy: { id: string; title: string };
    savedAt: Date;
    hasApplied: boolean;
}

@Injectable()
export class SavedJobService {
    constructor(
        @InjectRepository(SavedJob)
        private savedJobsTable: Repository<SavedJob>,
        @InjectRepository(Application)
        private applicationsTable: Repository<Application>,
    ) {}

    async findAllByUser(userId: number): Promise<SavedJob[]> {
        return this.savedJobsTable.find({
            where: { userId },
            relations: ['vacancy', 'vacancy.department'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAllForAdmin(params: {
        vacancyId?: number;
        page: number;
        limit: number;
    }): Promise<{
        items: AdminFavoriteJob[];
        totalItems: number;
        totalPages: number;
    }> {
        const { vacancyId, page, limit } = params;

        const qb = this.savedJobsTable
            .createQueryBuilder('saved')
            .leftJoinAndSelect('saved.user', 'user')
            .leftJoinAndSelect('user.applicant', 'applicant')
            .leftJoinAndSelect('saved.vacancy', 'vacancy')
            .where('user.applicantId IS NOT NULL');

        if (vacancyId) {
            qb.andWhere('saved.vacancyId = :vacancyId', { vacancyId });
        }

        qb.orderBy('saved.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [rows, totalItems] = await qb.getManyAndCount();

        const applicantIds = rows
            .map((r) => r.user?.applicantId)
            .filter((id): id is number => !!id);
        const vacancyIds = rows.map((r) => r.vacancyId);

        const applications =
            applicantIds.length && vacancyIds.length
                ? await this.applicationsTable
                      .createQueryBuilder('app')
                      .select(['app.applicantId', 'app.vacancyId'])
                      .where('app.applicantId IN (:...applicantIds)', {
                          applicantIds,
                      })
                      .andWhere('app.vacancyId IN (:...vacancyIds)', {
                          vacancyIds,
                      })
                      .getMany()
                : [];

        const appliedSet = new Set(
            applications.map((a) => `${a.applicantId}:${a.vacancyId}`),
        );

        const items: AdminFavoriteJob[] = rows.map((r) => ({
            id: String(r.id),
            applicant: {
                id: String(r.user?.applicantId ?? ''),
                fullName: r.user?.fullName ?? '',
                email: r.user?.email ?? '',
                phone: r.user?.phone ?? '',
            },
            vacancy: {
                id: String(r.vacancyId),
                title: r.vacancy?.title ?? '',
            },
            savedAt: r.createdAt,
            hasApplied: appliedSet.has(
                `${r.user?.applicantId}:${r.vacancyId}`,
            ),
        }));

        return {
            items,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        };
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
