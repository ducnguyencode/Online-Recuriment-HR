import { IsEmail } from 'class-validator';

export class ResendVerifyDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;
}
