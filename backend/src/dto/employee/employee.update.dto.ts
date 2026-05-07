import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmployeeUpdateDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
