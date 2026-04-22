import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VacancyStatus } from 'src/common/enum';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { VacancyUpdateDto } from 'src/dto/vacancy/vacancy.update.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { Repository } from 'typeorm';

@Injectable()
export class VacanciesService {
  constructor(
    @InjectRepository(Vacancy) private vacanciesTable: Repository<Vacancy>,
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
      if (status === VacancyStatus.OPENED) {
        qb.andWhere(`vacancy.status::text IN ('Open', 'Opened')`);
      } else if (status === VacancyStatus.CLOSED) {
        qb.andWhere(`vacancy.status::text IN ('Close', 'Closed')`);
      } else {
        qb.andWhere('vacancy.status::text = :status', {
          status,
        });
      }
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    qb.orderBy('vacancy.createdAt', 'DESC');

    const [vacancies, totalVacancy] = await qb.getManyAndCount();
    const normalized = vacancies.map((vacancy) => {
      if (vacancy.status === 'Opened') vacancy.status = 'Open';
      if (vacancy.status === 'Closed') vacancy.status = 'Close';
      return vacancy;
    });

    return {
      items: normalized,
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
    return this.vacanciesTable.manager.transaction(async (manager) => {
      const vacancy = await this.vacanciesTable.findOneBy({ id });
      if (!vacancy) {
        throw new NotFoundException('Vacancy not found');
      }
      Object.assign(vacancy, data);
      return await manager.save(vacancy);
    });
  }

  async changeStatus(id: number, status: VacancyStatus) {
    const vacancy = await this.vacanciesTable.findOneBy({ id });

    if (!vacancy) {
      throw new NotFoundException('Department not found');
    }

    vacancy.status = status;

    return this.vacanciesTable.save(vacancy);
  }
}
