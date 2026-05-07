import { VacancyStatus } from 'src/common/enum';
import { Department } from 'src/entities/department.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'V' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @ManyToOne(() => Department, (d) => d.id, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @Column({ nullable: true })
  departmentId!: number;

  @ManyToOne(() => User, (u) => u.id, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column()
  createdById!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column('int', { default: 1 })
  numberOfOpenings!: number;

  @Column('int', { default: 0 })
  filledCount!: number;

  @Column({ type: 'enum', enum: VacancyStatus, default: VacancyStatus.OPENED })
  status!: VacancyStatus;

  @Column('date', { nullable: true })
  closingDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
