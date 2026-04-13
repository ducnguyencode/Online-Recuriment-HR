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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Exclude()
  @ManyToOne(() => Department, (d) => d.id, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @Column('uuid', { nullable: true })
  departmentId!: string;

  @Column('varchar', { nullable: false })
  title!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column('int')
  numberOfOpenings!: number;

  @Column('int', { default: 0 })
  currentHiredCount!: number;

  @Column('varchar', { default: 'Opened' })
  status!: string;

  @Column('date')
  closingDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
