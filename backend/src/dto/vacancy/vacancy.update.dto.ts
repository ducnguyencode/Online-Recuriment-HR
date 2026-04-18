import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsAfterToday } from 'src/common/validator/decorator.validator';

export class VacancyUpdateDto {
  @IsNumber()
  departmentId!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  numberOfOpenings!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsAfterToday({ message: 'Closing date must be future date' })
  closingDate!: Date;
}
