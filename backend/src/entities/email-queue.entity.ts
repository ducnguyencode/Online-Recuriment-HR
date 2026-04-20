import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emails_queue')
export class EmailQueue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    recipientEmail: string;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    bodyHtml: string;

    @Column({
        type: 'enum',
        enum: ['Pending', 'Sent', 'Failed'],
        default: 'Pending'
    })
    status: string;

    @Column({ length: 50 })
    emailType: string; // Invite/Register/Result

    @Column({ default: 0 })
    retryCount: number;

    @Column({ type: 'timestamptz', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    sentAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}