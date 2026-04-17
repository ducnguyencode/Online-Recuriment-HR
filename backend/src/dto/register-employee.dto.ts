import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from 'src/enum/user-role.enum';

export class RegisterEmployeeDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  role?: UserRole.HR | UserRole.INTERVIEWER;
}
