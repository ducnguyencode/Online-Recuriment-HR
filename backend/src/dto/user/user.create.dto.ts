import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone!: string;
}
