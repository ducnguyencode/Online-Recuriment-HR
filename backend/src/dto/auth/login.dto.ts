import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  /** applicant = public URL (all roles), staff = staff URL (non-applicant only), unified = any URL (all roles) */
  @IsOptional()
  @IsIn(['applicant', 'staff', 'unified'])
  portal?: 'applicant' | 'staff' | 'unified';
}
