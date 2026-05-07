import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class EmployeeChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol',
  })
  newPassword!: string;

  @IsString()
  @Length(6)
  confirmPassword!: string;
}
