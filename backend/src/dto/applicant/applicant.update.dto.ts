import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class ApplicantUpdateDto {
  @IsNotEmpty({ message: 'Full name should not be empty' })
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsNotEmpty({ message: 'Phone number should not be empty' })
  @Length(10, 10)
  phone!: string;
}
