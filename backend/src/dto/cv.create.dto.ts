import { IsString } from 'class-validator';

export class CvCreateDto {
  @IsString()
  applicantId!: number;
}
