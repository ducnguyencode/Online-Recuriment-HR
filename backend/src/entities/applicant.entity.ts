import { ApplicantStatus } from 'src/enum/applicant-staus.enum';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('applicants')
@Index('UQ_applicant_email', ['email'], { unique: true })
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code!: string;

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({
    type: 'enum',
    enum: ApplicantStatus,
    default: ApplicantStatus.NOT_IN_PROCESS,
  })
  status!: string;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalize() {
    if (this.email) {
      this.email = this.email.trim();
    }
  }
}
