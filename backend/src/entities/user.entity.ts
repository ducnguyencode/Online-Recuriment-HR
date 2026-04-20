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
  applicant!: Applicant;

  @OneToOne(() => Employee, (e) => e.user)
  @JoinColumn()
  employee!: Employee;

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

  @Exclude()
  @Column({ default: false })
  isVerified!: boolean;

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
