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

  @ManyToOne(() => Vacancy, (v) => v.applications)
  @JoinColumn({ name: 'vacancyId' })
  vacancy!: Vacancy;

  @Column()
  vacancyId!: number;

  @ManyToOne(() => CV, (c) => c.applications, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cvId' })
  cv!: CV | null;

  @Column({ nullable: true })
  cvId!: number | null;

  @Column('int', { nullable: true })
  submittedCvOriginalCvId!: number | null;

  @Column('varchar', { nullable: true })
  submittedCvFileName!: string | null;

  @Column('varchar', { nullable: true })
  submittedCvFileUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ApplicationStatus.PENDING,
  })
  status!: ApplicationStatus;

  @Column('jsonb', { nullable: true, default: new AiResponseDto() })
  aiPreview!: AiResponseDto;

  @Column('text', { nullable: true })
  hrNotes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany('Interview', 'application')
  interviews!: any[];
}
