import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Application } from './application.entity';

@Entity('interviews')
export class Interview {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp' })
    startTime: Date;

    @Column({ type: 'timestamp' })
    endTime: Date;

    @Column({ nullable: true })
    googleMeetLink: string; // Đây là "long mạch" của chúng ta

    @Column({ nullable: true })
    googleCalendarEventId: string; // Để sau này muốn xóa/sửa lịch trên Google

    @ManyToOne(() => Application, (a) => a.interviews)
    @JoinColumn({ name: 'applicationId' })
    application: Application;

    @Column()
    applicationId: number;

    @CreateDateColumn()
    createdAt: Date;
}