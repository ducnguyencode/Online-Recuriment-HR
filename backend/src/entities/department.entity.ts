import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true, nullable: false })
  name!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees!: Employee[];
}
