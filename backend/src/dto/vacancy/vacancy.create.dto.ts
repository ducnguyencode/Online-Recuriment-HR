import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class VacancyCreateDto {
  @IsNumber()
  departmentId!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  numberOfOpenings!: number;

  @IsOptional()
  status!: string;

  @IsOptional()
  closingDate!: Date;
}
