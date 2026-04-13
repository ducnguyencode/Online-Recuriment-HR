import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import type { ParsedDataAi } from 'src/interfaces/parsed-data-ai.interface';
import { Exclude } from 'class-transformer';

@Entity('cvs')
export class CV {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Exclude()
  @ManyToOne(() => Applicant, (a) => a.id)
  @JoinColumn({ name: 'applicantId' })
  applicant!: Applicant;

  @Column('uuid')
  applicantId!: string;

  @Column('varchar', { nullable: true })
  fileUrl!: string;

  @Column('jsonb', { nullable: true })
  parsedDataAi!: ParsedDataAi;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
