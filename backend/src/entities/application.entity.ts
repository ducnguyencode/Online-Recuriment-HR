import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import { CV } from './cv.entity';
import { Vacancy } from './vacancy.entity';
import { AiResponseDto } from 'src/dto/ai.response.dto';
import { ApplicationStatus } from 'src/common/enum';

@Entity('applications')
@Index('UQ_applicant_vacancy', ['vacancy', 'applicant'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'A' || LPAD(id::text, 4,'0')`,
  })
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

  @ManyToOne(() => CV, (c) => c.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cvId' })
  cv!: CV | null;

  @Column({ nullable: true })
  cvId!: number | null;

  @Column({
    type: 'enum',
    default: ApplicationStatus.PENDING,
    enum: ApplicationStatus,
  })
  status!: ApplicationStatus;

  @Column('jsonb', { nullable: true })
  aiPreview!: AiResponseDto;

  @Column('text', { nullable: true })
  hrNotes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
