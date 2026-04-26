export enum AiPreviewStatus {
  IDLE = 'Idle',
  WAITING = 'Waiting',
  RUNNING = 'Running',
  COMPLETE = 'Completed',
  FAILED = 'Failed',
}

export interface AiPreviewJobData {
  applicationId: number;
}
