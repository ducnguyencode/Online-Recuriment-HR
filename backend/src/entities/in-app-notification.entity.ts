import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('in_app_notifications')
export class InAppNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Tương đương NotificationID

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'],
    default: 'INFO',
  })
  type!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ nullable: true })
  linkUrl!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  // --- RELATIONS ---
  @ManyToOne(() => UserAccount, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserAccount;
}
