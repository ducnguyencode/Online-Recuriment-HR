import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApplicantCreateDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @MaxLength(10)
  phone?: string;
}
