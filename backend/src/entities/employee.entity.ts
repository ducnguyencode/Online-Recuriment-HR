import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { User } from './user.entity';

@Entity('employees')
@Index('UQ_employee_user', ['user'], { unique: true })
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'E' || LPAD(id::text, 4, '0')`,
  })
  code!: string;

  @OneToOne(() => User, (u) => u.employee)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Department, (d) => d.id, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
