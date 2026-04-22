import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { VacancyStatus } from 'src/common/enum';

export class VacancyFindDto {
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
  @Transform(({ value }) => {
    if (value === 'Open') return VacancyStatus.OPENED;
    if (value === 'Close') return VacancyStatus.CLOSED;
    return value;
  })
  @IsEnum(VacancyStatus)
  status?: VacancyStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;
}
