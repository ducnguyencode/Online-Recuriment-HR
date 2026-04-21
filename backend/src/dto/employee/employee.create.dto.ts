import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { UserRole } from 'src/common/enum';

export class EmployeeCreateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsEnum(UserRole)
  @IsIn([UserRole.INTERVIEWER, UserRole.HR])
  role!: UserRole;

  @IsInt()
  departmentId!: number;

  @IsString()
  @IsOptional()
  jobTitle!: string;

  @IsString()
  @IsOptional()
  @Length(10, 10)
  phone!: string;
}
