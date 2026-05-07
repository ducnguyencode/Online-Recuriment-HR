import { UserRole } from 'src/common/enum';

export class SafeUserDto {
  id!: number;
  email!: string;
  role!: UserRole;
  fullName!: string;
  phone?: string;
  employeeId?: number;
  isVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
