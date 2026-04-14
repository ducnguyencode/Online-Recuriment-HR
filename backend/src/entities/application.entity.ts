import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import { CV } from './cv.entity';
import { Vacancy } from './vacancy.entity';
import { AiResponseDto } from 'src/dto/ai.response.dto';

@Entity('applications')
@Unique(['applicantId', 'vacancyId'])
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @ManyToOne(() => Applicant, (a) => a.id)
  @JoinColumn({ name: 'applicantId' })
  applicant!: Applicant;

  @Column()
  applicantId!: number;

  @ManyToOne(() => Vacancy, (v) => v.id)
  @JoinColumn({ name: 'vacancyId' })
  vacancy!: Vacancy;

  @Column()
  vacancyId!: number;

  @ManyToOne(() => CV, (c) => c.id)
  @JoinColumn({ name: 'cvId' })
  cv!: CV;

  @Column()
  cvId!: number;

  @Column({
    type: 'enum',
    default: 'Applied',
    enum: ['Applied', 'Screening', 'Interviewing', 'Hired', 'Rejected'],
  })
  status!: string;

  @Column('jsonb', { nullable: true })
  aiPrivew!: AiResponseDto;

  @Column('text', { nullable: true })
  hrNotes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
