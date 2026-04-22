import { IsString, MinLength } from 'class-validator';

export class SetInitialPasswordDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
