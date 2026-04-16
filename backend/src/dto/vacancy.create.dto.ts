import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class VacancyCreateDto {
  // Frontend gửi UUID string; để tránh mismatch version UUID theo class-validator,
  // chỉ validate là string (TypeORM/Postgres sẽ đảm bảo tính hợp lệ qua FK/uuid column).
  @IsString()
  departmentId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  numberOfOpenings!: number;

  // Frontend hiện không gửi status khi create, nên status được cho phép optional.
  // Vacancy entity có default 'Opened'.
  @IsOptional()
  @IsString()
  status?: string;

  // Frontend có thể gửi '' nếu user chưa chọn ngày.
  // Service sẽ tự fallback sang một closingDate hợp lệ nếu parse thất bại.
  @IsOptional()
  @IsString()
  closingDate?: string; // frontend gửi ISO string
}
