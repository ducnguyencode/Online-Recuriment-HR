import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
