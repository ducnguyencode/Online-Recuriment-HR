import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { UserAccount } from './user-account.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @Column('uuid', { nullable: true })
  departmentId!: string | null;

  @Column('varchar', { length: 100 })
  fullName!: string;

  @Column('varchar', { length: 120, unique: true })
  email!: string;

  @Column('varchar', { length: 20, nullable: true })
  phone!: string | null;

  @Column('varchar', { length: 100, nullable: true })
  jobTitle!: string | null;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @OneToOne(() => UserAccount, (account) => account.employee)
  userAccount!: UserAccount;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
