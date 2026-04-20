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
    const { page, limit, status, title, departmentId } = request;

    const qb = this.vacanciesTable
      .createQueryBuilder('vacancy')
      .leftJoinAndSelect('vacancy.department', 'department')
      .leftJoinAndSelect('vacancy.createdBy', 'createdBy');

    //Filter
    if (title) {
      qb.andWhere('vacancy.title ILIKE :title', {
        title: `%${title}%`,
      });
    }

    if (departmentId) {
      qb.andWhere('vacancy.departmentId = :deparmentId', {
        deparmentId: departmentId,
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
