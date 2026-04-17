import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from 'src/enum/user-role.enum';
import { Employee } from './employee.entity';
import { Applicant } from './applicant.entity';
import { LoginHistory } from './login-history.entity';
import { ActivityLog } from './activity-log.entity';

@Entity('user_accounts')
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Employee, (employee) => employee.userAccount, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee | null;

  @Column('uuid', { nullable: true, unique: true })
  employeeId!: string | null;

  @OneToOne(() => Applicant, { nullable: true })
  @JoinColumn({ name: 'applicantId' })
  applicant!: Applicant | null;

  @Column('int', { nullable: true, unique: true })
  applicantId!: number | null;

  @Column('varchar', { unique: true, length: 120 })
  email!: string;

  @Column('varchar')
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column('varchar', { nullable: true })
  resetPasswordToken!: string | null;

  @Column('timestamptz', { nullable: true })
  resetPasswordTokenExpiredAt!: Date | null;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @OneToMany(() => LoginHistory, () => undefined)
  loginHistory!: LoginHistory[];

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.userAccount)
  activityLogs!: ActivityLog[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
