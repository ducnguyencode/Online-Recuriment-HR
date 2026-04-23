import { IsString, Length } from 'class-validator';

export class EmployeeChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Length(6)
  newPassword!: string;

  @IsString()
  @Length(6)
  confirmPassword!: string;
}
