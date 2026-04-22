import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmployeeUpdateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
