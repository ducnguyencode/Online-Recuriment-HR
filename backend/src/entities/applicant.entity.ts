import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { nullable: false })
  fullName!: string;

  @Column('varchar', { unique: true, nullable: true })
  email!: string;

  @Column('varchar', { nullable: false })
  phone!: string;

  @Column({
    type: 'enum',
    enum: ['OpenToWork', 'Hired', 'Banned'],
    default: 'OpenToWork',
  })
  status!: string;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => UserAccount, (account) => account.applicant)
  userAccount!: UserAccount;
}
