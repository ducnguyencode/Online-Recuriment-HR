export class VacancyCreateDto {
  departmentId!: number;
  title!: string;
  description!: string;
  numberOfOpenings!: number;
  status!: string;
  closingDate!: Date;
}
