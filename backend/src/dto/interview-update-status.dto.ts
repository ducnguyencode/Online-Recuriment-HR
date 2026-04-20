import { IsEnum, IsNotEmpty } from 'class-validator';
import { InterviewStatus } from '../enum/interview-status.enum';

export class InterviewUpdateStatusDto {
    @IsEnum(InterviewStatus)
    @IsNotEmpty()
    status: InterviewStatus;
}