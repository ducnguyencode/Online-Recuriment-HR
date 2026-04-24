import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class SetInitialPasswordDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol',
  })
  password!: string;
}
