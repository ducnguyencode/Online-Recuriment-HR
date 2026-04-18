import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    generatedType: 'STORED',
    asExpression: `'U' || LPAD(id::text, 4,'0')`,
  })
  code!: string;

  @Expose()
  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Expose()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.APPLICANT })
  role!: UserRole;

  @Expose()
  @Column()
  fullName!: string;

  @Exclude()
  @Column({ default: false })
  isVerified!: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  verificationToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  invitedUserExpiresAt!: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Expose()
  @CreateDateColumn()
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn()
  updatedAt!: Date;
}
