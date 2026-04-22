import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('signup_verifications')
export class SignupVerification {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  email!: string;

  /** Legacy 6-digit flow — optional */
  @Column({ type: 'varchar', length: 12, nullable: true })
  code!: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: true,
    name: 'verifyToken',
  })
  verifyToken!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'pendingFullName',
  })
  pendingFullName!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'pendingPasswordHash',
  })
  pendingPasswordHash!: string | null;

  @Column({ type: 'timestamptz', name: 'expiresAt' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'createdAt' })
  createdAt!: Date;
}
