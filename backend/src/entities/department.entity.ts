import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
@Index('UQ_department_name', ['name'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code!: string;

  @Column()
  name!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column('boolean', { default: true })
  isActive!: boolean;
}
