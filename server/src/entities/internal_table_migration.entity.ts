import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, BaseEntity } from 'typeorm';

export type InternalTableMigrationKind = 'structured' | 'raw_sql' | 'baseline';

@Entity({ name: 'internal_table_migrations' })
export class InternalTableMigration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'internal_table_id' })
  internalTableId: string;

  // A timestamp, not a counter — baselines get literal 1 (create) / 2 (foreign keys).
  @Column({ name: 'sequence', type: 'numeric', precision: 15 })
  sequence: string;

  @Column({ name: 'parent_migration_id', nullable: true })
  parentMigrationId: string | null;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'kind', type: 'enum', enum: ['structured', 'raw_sql', 'baseline'] })
  kind: InternalTableMigrationKind;

  @Column({ type: 'jsonb', name: 'payload' })
  payload: any;

  @Column({ type: 'jsonb', name: 'resulting_schema' })
  resultingSchema: any;

  @Column({ name: 'name', nullable: true })
  name: string | null;

  @Column({ name: 'description', nullable: true })
  description: string | null;

  @Column({ name: 'reverts_migration_id', nullable: true })
  revertsMigrationId: string | null;

  // Authoring provenance, stamped once — never the pushing instance's version.
  @Column({ name: 'tooljet_version', nullable: true })
  tooljetVersion: string | null;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
}
