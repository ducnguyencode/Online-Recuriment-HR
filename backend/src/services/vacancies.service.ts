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
    const closingDate = data.closingDate ? new Date(data.closingDate) : new Date(Date.now() + 30 * 86400000);
    const vacancy = this.vacanciesTable.create({
      title: data.title,
      description: data.description,
      numberOfOpenings: data.numberOfOpenings,
      closingDate,
      department: data.departmentId ? { id: data.departmentId } : null,
      ...(data.status ? { status: data.status } : {}),
    });

    return this.vacanciesTable.save(vacancy);
  }

  async update(id: string, payload: VacancyCreateDto) {
    const vacancy = await this.vacanciesTable.findOneOrFail({ where: { id } });

    vacancy.title = payload.title;
    vacancy.description = payload.description;
    vacancy.numberOfOpenings = payload.numberOfOpenings;
    if (payload.departmentId) vacancy.department = { id: payload.departmentId } as any;

    if (payload.closingDate) {
      const closingDate = new Date(payload.closingDate);
      if (!Number.isNaN(closingDate.getTime())) vacancy.closingDate = closingDate;
    }
    if (payload.status) vacancy.status = payload.status;

    return this.vacanciesTable.save(vacancy);
  }

  async changeStatus(id: string, status: string) {
    const vacancy = await this.vacanciesTable.findOneOrFail({ where: { id } });

    // Frontend dùng: Open | Suspended | Closed
    const mapped =
      status === 'Open' ? 'Opened' :
      status === 'Suspended' ? 'Suspended' :
      status === 'Closed' ? 'Closed' :
      status;

    vacancy.status = mapped;
    return this.vacanciesTable.save(vacancy);
  }
}
