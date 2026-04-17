import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import { CV } from './cv.entity';
import { Vacancy } from './vacancy.entity';
import { AiResponseDto } from 'src/dto/ai.response.dto';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { Interview } from './interview.entity';

@Entity('applications')
@Index('UQ_applicant_vacancy', ['vacancy', 'applicant'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
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
  cv!: CV | null;

  @Column({ nullable: true })
  cvId!: number;

  @Column({
    type: 'enum',
    default: ApplicationStatus.PENDING,
    enum: ApplicationStatus,
  })
  status!: string;

  @Column('jsonb', { nullable: true })
  aiPreview!: AiResponseDto;

  @Column('text', { nullable: true })
  hrNotes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Interview, (interview) => interview.application)
  interviews: Interview[];
}
