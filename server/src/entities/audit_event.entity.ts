import { Column, Entity, PrimaryColumn } from 'typeorm';

// Append-only (enforced by a DB trigger). No foreign keys: events outlive the users,
// workspaces and tokens they describe, which are kept as snapshots in actor/target.
@Entity({ name: 'audit_events' })
export class AuditEvent {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id: string;

  @PrimaryColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'outcome', type: 'varchar', length: 10 })
  outcome: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 10 })
  actorType: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({ name: 'actor_token_id', type: 'uuid', nullable: true })
  actorTokenId: string | null;

  @Column({ name: 'actor', type: 'jsonb' })
  actor: Record<string, unknown>;

  @Column({ name: 'target_type', type: 'varchar', length: 50 })
  targetType: string;

  @Column({ name: 'target_id', type: 'varchar', length: 255, nullable: true })
  targetId: string | null;

  @Column({ name: 'target', type: 'jsonb' })
  target: Record<string, unknown>;

  @Column({ name: 'changes', type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @Column({ name: 'bulk', type: 'boolean', default: false })
  bulk: boolean;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'request_id', type: 'varchar', length: 64 })
  requestId: string;

  @Column({ name: 'schema_version', type: 'smallint', default: 1 })
  schemaVersion: number;
}
