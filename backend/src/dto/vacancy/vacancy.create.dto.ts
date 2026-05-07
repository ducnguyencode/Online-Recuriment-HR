import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsAfterToday } from 'src/common/validator/decorator.validator';

export class VacancyCreateDto {
  @IsInt()
  departmentId!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(1)
  numberOfOpenings!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsAfterToday()
  closingDate!: Date;
}
