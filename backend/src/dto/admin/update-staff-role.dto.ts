import { IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enum';

export class UpdateStaffRoleDto {
  @IsEnum(UserRole)
  role!: UserRole.HR | UserRole.INTERVIEWER;
}
