import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { ApplicantStatus } from 'src/common/enum';
import { User } from './user.entity';
import { Expose } from 'class-transformer';

@Entity('applicants')
@Index('UQ_applicant_user', ['user'], { unique: true })
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'A' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @Expose()
  @OneToOne(() => User, (u) => u.applicant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Application, (a) => a.applicant)
  applications!: Application[];

  @Column({
    type: 'enum',
    enum: ApplicantStatus,
    default: ApplicantStatus.NOT_IN_PROCESS,
  })
  status!: ApplicantStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
    email: any;
    fullName: any;
}
