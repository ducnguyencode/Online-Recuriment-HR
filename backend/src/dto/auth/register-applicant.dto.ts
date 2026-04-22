import { IsEmail, IsString, MinLength } from 'class-validator';

/** Direct registration when REQUIRE_EMAIL_VERIFICATION=false */
export class RegisterApplicantDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
