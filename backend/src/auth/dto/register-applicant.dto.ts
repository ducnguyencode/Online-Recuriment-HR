import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterApplicantDto {
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
}
