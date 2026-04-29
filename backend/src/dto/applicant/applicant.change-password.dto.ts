import { IsNotEmpty, Matches } from 'class-validator';

export class ApplicantChangePasswordDto {
  @IsNotEmpty({ message: 'Current password should not be empty!' })
  currentPassword!: string;

  @IsNotEmpty({ message: 'New password should not be empty!' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol',
  })
  newPassword!: string;

  @IsNotEmpty({ message: 'Confirm password should not be empty!' })
  confirmPassword!: string;
}
