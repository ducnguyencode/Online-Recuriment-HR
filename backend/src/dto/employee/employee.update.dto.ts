import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmployeeUpdateDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
