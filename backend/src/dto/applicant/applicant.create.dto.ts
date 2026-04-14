import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ApplicantCreateDto {
  @IsString()
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsOptional()
  phone!: string;
}
