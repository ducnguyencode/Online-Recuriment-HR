import { Vacancy } from 'src/entities/vacancy.entity';

export class VacancyFindResponseDto {
  vacancies!: Vacancy[];
  totalPage!: number;
  totalVacancy!: number;
}
