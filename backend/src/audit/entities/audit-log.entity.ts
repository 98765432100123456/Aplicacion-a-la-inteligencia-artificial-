import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Bitácora de acciones críticas (RF34, RNF08). Solo inserciones. */
@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ length: 60 })
  action: string;

  @Column({ length: 40 })
  entity: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 60, nullable: true })
  entityId: string | null;

  @Column({ type: 'json', nullable: true })
  detail: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
