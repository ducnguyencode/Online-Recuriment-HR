import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import { Employee } from './employee.entity';

@Entity('users')
@Index('UQ_user_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'U' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @OneToOne(() => Applicant, (a) => a.user)
  @JoinColumn({ name: 'applicantId' })
  applicant!: Applicant;

  @OneToOne(() => Employee, (e) => e.user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @Expose()
  @Column({ nullable: true })
  employeeId!: number;

  @Expose()
  @Column()
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Expose()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.APPLICANT })
  role!: UserRole;

  @Expose()
  @Column()
  fullName!: string;

  @Expose()
  @Column({ nullable: true })
  phone!: string;

  @Expose()
  @Column({ default: false })
  isVerified!: boolean;

  @Expose()
  @Column({ default: true })
  isActive!: boolean;

  @Exclude()
  @Column({ default: false })
  mustChangePassword!: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  roles!: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  verificationToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  invitedUserExpiresAt!: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordTokenExpiresAt!: Date | null;

  @Expose()
  @CreateDateColumn()
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn()
  updatedAt!: Date;
}
