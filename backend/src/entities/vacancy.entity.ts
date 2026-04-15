import { Exclude } from 'class-transformer';
import { Department } from 'src/entities/department.entity';
import { VacancyStatus } from 'src/enum/vacancy-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('vacancies')
@Index('UQ_vacancy_title_department', ['title', 'department'], { unique: true })
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code!: string;

  @ManyToOne(() => Department, (d) => d.id, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @Column({ nullable: true })
  departmentId!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column('int', { default: 1 })
  numberOfOpenings!: number;

  @Column('int', { default: 0 })
  filledCount!: number;

  @Column({ type: 'enum', enum: VacancyStatus, default: VacancyStatus.OPENED })
  status!: string;

  @Column('date', { nullable: true })
  closingDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
