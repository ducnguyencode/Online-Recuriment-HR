import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Tương đương EmployeeID

    @Column({ name: 'employee_code', unique: true })
    employeeCode: string;

    @Column({ length: 255 })
    fullName: string;

    @Column({ unique: true })
    email: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ name: 'department_id', nullable: true })
    departmentId: string;

    @Column({ length: 255, nullable: true })
    jobTitle: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}