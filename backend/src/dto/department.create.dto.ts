import { IsNotEmpty, IsOptional } from 'class-validator';

export class DepartmentCreateDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  description!: string;

  isActive!: boolean;
}
