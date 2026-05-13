/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationStatus, VacancyStatus } from 'src/common/enum';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { VacancyUpdateDto } from 'src/dto/vacancy/vacancy.update.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { Repository } from 'typeorm';
import { AiPreviewService } from './bullmq/ai-worker/ai-preview.service';

const VACANCY_STATUS_TRANSITIONS: Record<VacancyStatus, VacancyStatus[]> = {
  [VacancyStatus.OPENED]: [VacancyStatus.CLOSED, VacancyStatus.SUSPENDED],
  [VacancyStatus.SUSPENDED]: [VacancyStatus.OPENED, VacancyStatus.CLOSED],
  [VacancyStatus.CLOSED]: [],
};

@Injectable()
export class VacanciesService {
  constructor(
    @InjectRepository(Vacancy) private vacanciesTable: Repository<Vacancy>,
    private aiPreviewService: AiPreviewService,
  ) {}

  //Find All
  async findAll(request: VacancyFindDto): Promise<FindResponseDto<Vacancy>> {
    const { page, limit, status, search, departmentId } = request;

    const qb = this.vacanciesTable
      .createQueryBuilder('vacancy')
      .leftJoinAndSelect('vacancy.department', 'department')
      .leftJoinAndSelect('vacancy.createdBy', 'createdBy');

    //Filter
    if (search) {
      qb.andWhere('vacancy.title ILIKE :title', {
        title: `%${search}%`,
      });
    }

    if (departmentId) {
      qb.andWhere('vacancy.departmentId = :departmentId', {
        departmentId: departmentId,
      });
    }

    if (status) {
      qb.andWhere('vacancy.status = :status', {
        status: status,
      });
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    qb.orderBy('vacancy.createdAt', 'DESC');

    //Load favorites count per vacancy
    qb.loadRelationCountAndMap('vacancy.favoritesCount', 'vacancy.savedJobs');

    const [vacancies, totalVacancy] = await qb.getManyAndCount();

    return {
      items: vacancies,
      totalItems: totalVacancy,
      totalPage: Math.ceil(totalVacancy / limit),
    };
  }

  async create(data: VacancyCreateDto, user: SafeUserDto) {
    return await this.vacanciesTable.manager.transaction(async (manager) => {
      const vacancy = manager.create(Vacancy, {
        ...data,
        department: data.departmentId ? { id: data.departmentId } : null,
        createdById: user.id,
      });
      const newVacancy = await manager.save(vacancy);

      return manager.save(newVacancy);
    });
  }

  async update(id: number, data: VacancyUpdateDto) {
    const vacancy = await this.vacanciesTable.manager.transaction(
      async (manager) => {
        const exist = await manager.findOne(Vacancy, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!exist) {
          throw new NotFoundException('Vacancy not found');
        }

        if (
          data.numberOfOpenings != null &&
          data.numberOfOpenings < exist.filledCount
        ) {
          throw new BadRequestException(
            `You already selected ${exist.filledCount} applicant(s) for this vacancy. Please set openings to ${exist.filledCount} or more.`,
          );
        }

        const sanitized: Partial<VacancyUpdateDto> = { ...data };
        if (sanitized.numberOfOpenings == null) {
          delete sanitized.numberOfOpenings;
        }
        Object.assign(exist, sanitized);

        if (exist.filledCount >= exist.numberOfOpenings) {
          exist.status = VacancyStatus.CLOSED;
        }

        return manager.save(exist);
      },
    );

    const applicationIds = (
      await this.vacanciesTable
        .createQueryBuilder('vacancy')
        .leftJoin('vacancy.applications', 'app')
        .select('app.id', 'applicationId')
        .andWhere('vacancy.id = :id', { id: vacancy.id })
        .andWhere('app.status NOT IN (:...statuses)', {
          statuses: [
            ApplicationStatus.REJECTED,
            ApplicationStatus.SELECTED,
            ApplicationStatus.NOT_REQUIRED,
          ],
        })
        .getRawMany()
    ).map((x) => x.applicationId);

    await Promise.all(
      applicationIds.map(async (a) => {
        await this.aiPreviewService.start(a);
      }),
    );

    return vacancy;
  }

  async changeStatus(id: number, status: VacancyStatus) {
    const vacancy = await this.vacanciesTable.findOneBy({ id });

    if (!vacancy) {
      throw new NotFoundException('Vacancy not found');
    }

    if (vacancy.status === status) {
      return vacancy;
    }

    if (!VACANCY_STATUS_TRANSITIONS[vacancy.status].includes(status)) {
      throw new ForbiddenException(
        `Cannot change vacancy status from ${vacancy.status} to ${status}.`,
      );
    }

    if (status === VacancyStatus.OPENED) {
      const now = new Date();

      if (vacancy.closingDate) {
        const closing = new Date(vacancy.closingDate);
        closing.setHours(23, 59, 59, 999);
        if (closing < now) {
          throw new ForbiddenException(
            'This vacancy cannot be reopened because the closing date has passed.',
          );
        }
      }
      if (vacancy.filledCount >= vacancy.numberOfOpenings) {
        throw new ForbiddenException(
          'This vacancy already has all openings filled. Increase openings before reopening it.',
        );
      }
      if (
        await this.vacanciesTable.exists({
          where: { title: vacancy.title, status: VacancyStatus.OPENED },
        })
      ) {
        throw new ForbiddenException(
          'Another open vacancy with the same title already exists.',
        );
      }
    }
    vacancy.status = status;

    return this.vacanciesTable.save(vacancy);
  }
}
