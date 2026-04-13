import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
