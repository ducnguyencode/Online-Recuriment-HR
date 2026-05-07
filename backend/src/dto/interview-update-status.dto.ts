import { IsEnum, IsNotEmpty } from 'class-validator';
import { InterviewStatus } from 'src/common/enum';

export class InterviewUpdateStatusDto {
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  status!: InterviewStatus;
}
