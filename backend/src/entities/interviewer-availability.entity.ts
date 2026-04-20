import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('interviewer_availability')
export class InterviewerAvailability {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'employee_id' })
    employeeId: string;

    @Column({ type: 'date' })
    availableDate: string;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @Column({ default: false })
    isBooked: boolean;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;
}