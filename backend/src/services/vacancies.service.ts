import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { VacancyFindResponseDto } from 'src/dto/vacancy/vacancy.find.response.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VacanciesService {
  constructor(
    @InjectRepository(Vacancy) private vacanciesTable: Repository<Vacancy>,
  ) {}

  //Find All
  async findAll(request: VacancyFindDto): Promise<VacancyFindResponseDto> {
    const { page, limit, status, title, departmentId } = request;

    const qb = this.vacanciesTable.createQueryBuilder('vacancy');

    qb.leftJoinAndSelect('vacancy.department', 'department');

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
      vacancies,
      totalVacancy,
      totalPage: Math.ceil(totalVacancy / limit),
    };
  }

  create(data: VacancyCreateDto) {
    return this.vacanciesTable.manager.transaction(async (manager) => {
      const vacancy = manager.create(Vacancy, {
        ...data,
        department: data.departmentId ? { id: data.departmentId } : null,
      });
      const newVacancy = await manager.save(vacancy);

      newVacancy.code = `V${newVacancy.id.toString().padStart(4, '0')}`;
      return manager.save(newVacancy);
    });
  }
}
