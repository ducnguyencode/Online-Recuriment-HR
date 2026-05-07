import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CvCreateDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  applicantId!: number;
}
