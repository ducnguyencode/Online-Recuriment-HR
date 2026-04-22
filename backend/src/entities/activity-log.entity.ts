import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', nullable: true, name: 'actorUserId' })
  actorUserId!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'actorEmail' })
  actorEmail!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'actorFullName',
  })
  actorFullName!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'actorRole' })
  actorRole!: string;

  @Column({ type: 'varchar', length: 10, name: 'httpMethod' })
  httpMethod!: string;

  @Column({ type: 'varchar', length: 512 })
  path!: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'resourceType' })
  resourceType!: string | null;

  @Column({ type: 'int', nullable: true, name: 'resourceId' })
  resourceId!: number | null;

  @Column({ type: 'text', nullable: true })
  detail!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'createdAt' })
  createdAt!: Date;
}
