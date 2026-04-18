import { IsEnum } from 'class-validator';
import { ApplicantStatus } from 'src/common/enum';

export class ApplicantStatusUpdateDto {
  @IsEnum(ApplicantStatus)
  status!: ApplicantStatus;
}
