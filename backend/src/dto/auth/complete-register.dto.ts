import { IsString, Length } from 'class-validator';

export class CompleteRegisterDto {
  @IsString()
  @Length(32, 64)
  token!: string;
}
