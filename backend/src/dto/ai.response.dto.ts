import { ParsedDataAi } from 'src/interfaces/parsed-data-ai.interface';
export enum AiPreviewStatus {
  IDLE = 'Idle',
  RUNNING = 'Running',
  COMPLETE = 'Completed',
  FAILED = 'Failed',
}
export class AiResponseDto {
  cvData!: ParsedDataAi;
  matchScore!: number;
  sumaryAnalysis!: string;
  status: AiPreviewStatus = AiPreviewStatus.IDLE;
}
