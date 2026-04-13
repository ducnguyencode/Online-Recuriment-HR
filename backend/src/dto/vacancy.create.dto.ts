export class VacancyCreateDto {
  departmentId!: string;
  title!: string;
  description!: string;
  numberOfOpenings!: number;
  status!: string;
  closingDate!: Date;
}
