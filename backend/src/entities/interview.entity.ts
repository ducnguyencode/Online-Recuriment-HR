import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Application } from './application.entity';
import { InterviewerPanel } from './interviewer-panel.entity';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ length: 50, default: 'GoogleMeet' })
  meetPlatform!: string;

  @Column({ nullable: true })
  meetLink!: string;

  @Column({ name: 'google_calendar_event_id', nullable: true })
  googleCalendarEventId!: string;

  @Column({
    type: 'enum',
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled',
  })
  status!: string;

  @Column({ nullable: true })
  finalResult!: string; // Pass/Fail

  @ManyToOne(() => Application, { nullable: true })
  @JoinColumn({ name: 'application_id' })
  application!: Application | null;

  @OneToMany(() => InterviewerPanel, (panel) => panel.interview, {
    cascade: true,
  })
  panels!: InterviewerPanel[];
}
