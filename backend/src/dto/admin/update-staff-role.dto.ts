import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/common/enum';

export class UpdateStaffRoleDto {
  @IsEnum(UserRole)
  role!: UserRole.HR | UserRole.INTERVIEWER;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason!: string;
}
