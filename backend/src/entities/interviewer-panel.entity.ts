import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Interview } from './interview.entity';
import { Employee } from './employee.entity';

@Entity('interviewers_panel')
export class InterviewerPanel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'interview_id' })
  interviewId!: string;

  @Column({ name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'text', nullable: true })
  feedback!: string;

  @Column({
    type: 'enum',
    enum: ['Pass', 'Fail', 'Pending'],
    default: 'Pending',
  })
  vote!: string;

  // --- RELATIONS ---
  @ManyToOne(() => Interview, (interview) => interview.panels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'interview_id' })
  interview!: Interview;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;
}
