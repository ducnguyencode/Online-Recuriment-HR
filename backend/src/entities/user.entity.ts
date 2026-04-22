import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
  applicant!: Applicant;

  @OneToOne(() => Employee, (e) => e.user)
  employee!: Employee | null;

  @Expose()
  @Column()
  email!: string;

  @Exclude()
  /** DB column name kept for compatibility with existing PostgreSQL schemas. */
  @Column({ name: 'passwordHash' })
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

  @Column({ default: false })
  mustChangePassword!: boolean;

  /** Comma-separated USER_ROLES values (avoids PG text[] vs simple-array mismatch on legacy DBs). */
  @Column({ type: 'varchar', length: 512, nullable: true })
  roles!: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordTokenExpiresAt!: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  verificationToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  invitedUserExpiresAt!: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Expose()
  @CreateDateColumn()
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn()
  updatedAt!: Date;
}
