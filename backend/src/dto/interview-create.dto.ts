import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class InterviewCreateDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @IsNotEmpty()
  @IsDateString()
  endTime!: string;

  @IsNotEmpty()
  @IsNumber()
  applicationId!: number;

  @IsNotEmpty()
  @IsString()
  interviewerId!: string;
}
