import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ApplicantCreateDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  @IsOptional()
  email!: string;

  @IsString()
  phone!: string;
}
