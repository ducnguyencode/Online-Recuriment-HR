import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class InAppNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  title!: string;

  @Column('text')
  message!: string;

  @Column({
    type: 'enum',
    enum: ['SUCCESS', 'INFO', 'WARNING', 'ERROR'],
    default: 'INFO',
  })
  type!: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';

  @Column({ default: '' })
  linkUrl!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
