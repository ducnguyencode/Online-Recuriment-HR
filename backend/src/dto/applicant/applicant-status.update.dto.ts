import { IsEnum } from 'class-validator';
import { ApplicantStatus } from 'src/enum/applicant-staus.enum';

export class ApplicantStatusUpdateDto {
  @IsEnum(ApplicantStatus)
  status!: ApplicantStatus;
}
