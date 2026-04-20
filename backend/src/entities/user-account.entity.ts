import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Employee } from './employee.entity';
import { InAppNotification } from './in-app-notification.entity';

@Entity('user_accounts')
export class UserAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Tương đương UserID

    @Column({ unique: true })
    username: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: ['Superadmin', 'HR', 'Interviewer', 'Applicant'],
        default: 'Applicant'
    })
    role: string;

    // Khóa ngoại tới Employee (Có thể null nếu user này là Applicant)
    @Column({ name: 'employee_id', nullable: true })
    employeeId: string;

    // Khóa ngoại tới Applicant (Có thể null nếu user này là Employee)
    @Column({ name: 'applicant_id', nullable: true })
    applicantId: string;

    @Column({ nullable: true })
    resetPasswordToken: string;

    @Column({ type: 'timestamptz', nullable: true })
    resetTokenExpiry: Date;

    // Ép người dùng đổi mật khẩu ở lần đăng nhập đầu tiên (Bảo mật cao)
    @Column({ default: false })
    mustChangePassword: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    passwordChangedAt: Date;

    // Khóa ngoại tự chiếu (Self-referencing) để biết ai tạo ra tài khoản này
    @Column({ name: 'created_by_user_id', nullable: true })
    createdByUserId: string;

    @Column({ default: true })
    isActive: boolean;

    // --- RELATIONS ---
    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    // Liên kết tự chiếu: Trỏ về chính bảng UserAccount để lấy thông tin người tạo
    @ManyToOne(() => UserAccount)
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser: UserAccount;

    @OneToMany(() => InAppNotification, notification => notification.user)
    notifications: InAppNotification[];
}