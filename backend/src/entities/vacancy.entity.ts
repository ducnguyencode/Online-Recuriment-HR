import { Exclude } from 'class-transformer';
import { Department } from 'src/entities/department.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('vacancies')
@Unique(['title', 'department'])
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

  @Column('varchar', { nullable: false })
  title!: string;

  @Column('text', { nullable: false })
  description!: string;

  @Column('int', { default: 1 })
  numberOfOpenings!: number;

  @Column('int', { default: 0 })
  filledCount!: number;

  @Column('varchar', { default: 'Opened' })
  status!: string;

  @Column('date')
  closingDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
