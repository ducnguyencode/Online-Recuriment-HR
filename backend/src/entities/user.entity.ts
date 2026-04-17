import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
@Index('UQ_user_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code!: string;

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Exclude()
  @Column()
  passwordHash!: string;

  @Column('text', { array: true, default: '{}' })
  roles!: string[];

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('boolean', { default: true })
  mustChangePassword!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
