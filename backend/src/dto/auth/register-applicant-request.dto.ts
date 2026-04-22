import { IsEmail, IsString, MinLength } from 'class-validator';

/** Step 1: send verification link via Brevo when REQUIRE_EMAIL_VERIFICATION=true */
export class RegisterApplicantRequestDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
