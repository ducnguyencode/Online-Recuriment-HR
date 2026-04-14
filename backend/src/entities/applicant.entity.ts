import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

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
}
