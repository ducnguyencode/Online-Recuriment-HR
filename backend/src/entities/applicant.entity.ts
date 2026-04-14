import { ApplicantStatus } from 'src/enum/applicant-staus.enum';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code!: string;

  @Column('varchar', { nullable: false })
  fullName!: string;

  @Column('varchar', { unique: true, nullable: true })
  email!: string;

  @Column('varchar', { nullable: false })
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
