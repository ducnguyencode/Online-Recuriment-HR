import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('int')
  userId!: number;

  @Column('varchar', { length: 45, nullable: true })
  ipAddress!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  userAgent!: string | null;

  @Column('boolean', { default: true })
  isSuccess!: boolean;

  @Column('text', { nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  loggedAt!: Date;
}
