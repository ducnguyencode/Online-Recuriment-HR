import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApplicationStatus } from 'src/enum/application-status.enum';

export class ApplicationFindDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vacancyId?: number;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  applicantId?: number;
}
