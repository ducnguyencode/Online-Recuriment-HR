import { IsObject, IsOptional, IsString } from 'class-validator';
import type { ParsedDataAi } from 'src/interfaces/parsed-data-ai.interface';

export class CvCreateDto {
  @IsString()
  applicantId!: string;

  @IsString()
  @IsOptional()
  fileUrl!: string;

  @IsObject()
  @IsOptional()
  parsedDataAi!: ParsedDataAi;
}
