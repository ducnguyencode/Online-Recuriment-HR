import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ApplicationCreateDto {
  @IsInt()
  @Type(() => Number)
  applicantId!: number;

  @IsInt()
  @Type(() => Number)
  vacancyId!: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cvId!: number;
}
