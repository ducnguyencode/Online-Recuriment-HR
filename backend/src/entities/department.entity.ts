import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
@Index('UQ_department_name', ['name'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'D' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column('boolean', { default: true })
  isActive!: boolean;
}
