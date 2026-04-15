import { ParsedDataAi } from 'src/interfaces/parsed-data-ai.interface';

export class AiResponseDto {
  cvData!: ParsedDataAi;
  matchScore!: number;
  sumaryAnalysis!: string;
}
