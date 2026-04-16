import { IsOptional, IsString } from 'class-validator';

export class ApplicationCreateDto {
  @IsString()
  applicantId!: string;

  @IsString()
  vacancyId!: string;

  // Frontend attach flow có thể gửi thiếu cvId; backend sẽ tự tìm CV theo applicantId.
  @IsOptional()
  @IsString()
  cvId?: string;

  // Defaults:
  // - status: 'Applied'
  // - aiPrivew: null (AI review sẽ chạy và cập nhật nếu được)
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  hrNotes?: string;
}
