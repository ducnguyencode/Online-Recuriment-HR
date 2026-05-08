import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Vacancy } from './vacancy.entity';

@Entity('saved_jobs')
export class SavedJob {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne(() => Vacancy, (v) => v.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vacancyId' })
    vacancy!: Vacancy;

    @Column()
    vacancyId!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
