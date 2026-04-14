import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VacancyCreateDto } from 'src/dto/vacancy.create.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VacanciesService {
  constructor(
    @InjectRepository(Vacancy) private vacanciesTable: Repository<Vacancy>,
  ) {}

  findAll(): Promise<Vacancy[]> {
    return this.vacanciesTable.find();
  }

  create(data: VacancyCreateDto) {
    const vacancy = this.vacanciesTable.create({
      ...data,
      department: data.departmentId ? { id: data.departmentId } : null,
    });
    return this.vacanciesTable.save(vacancy);
  }
}
