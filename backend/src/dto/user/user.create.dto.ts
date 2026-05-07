import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol',
  })
  password!: string;
}
