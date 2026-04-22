import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_id', type: 'int', nullable: true })
  actorId!: number | null;

  @Column({ name: 'actor_role_snapshot', type: 'varchar', length: 100 })
  actorRoleSnapshot!: string;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ name: 'target_id', type: 'int', nullable: true })
  targetId!: number | null;

  @Column({ name: 'target_role_snapshot', type: 'varchar', length: 100, nullable: true })
  targetRoleSnapshot!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
