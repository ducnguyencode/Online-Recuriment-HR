import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { ApplicantStatus } from 'src/common/enum';

@Entity('applicants')
@Index('UQ_applicant_email', ['email'], { unique: true })
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'A' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @OneToMany(() => Application, (a) => a.applicant)
  applications!: Application[];

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
  status!: ApplicantStatus;

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
