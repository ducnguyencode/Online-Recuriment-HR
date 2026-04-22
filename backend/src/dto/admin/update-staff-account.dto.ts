import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from 'src/common/enum';

export class UpdateStaffAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEnum(UserRole)
  role!: UserRole.HR | UserRole.INTERVIEWER;

  @IsInt()
  @Type(() => Number)
  departmentId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
