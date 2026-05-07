import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Applicant } from './applicant.entity';
import { Exclude } from 'class-transformer';

@Entity('cvs')
export class CV {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'C' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @Exclude()
  @ManyToOne(() => Applicant, (a) => a.id)
  @JoinColumn({ name: 'applicantId' })
  applicant!: Applicant;

  @Column()
  applicantId!: number;

  @Column('varchar', { nullable: true })
  fileName!: string;

  @Column('varchar', { nullable: true })
  fileUrl!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
