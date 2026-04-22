import { VacancyStatus } from 'src/common/enum';
import { Department } from 'src/entities/department.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('vacancies')
@Index('UQ_vacancy_title_department', ['title', 'department'], { unique: true })
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

  @ManyToOne(() => User, (u) => u.id, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;

  @Column({ nullable: true })
  createdById!: number | null;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column('int', { default: 1 })
  numberOfOpenings!: number;

  @Column('int', { default: 0 })
  filledCount!: number;

  @Column({
    type: 'enum',
    enum: VacancyStatus,
    default: VacancyStatus.OPENED,
  })
  status!: string;

  @Column('date', { nullable: true })
  closingDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
