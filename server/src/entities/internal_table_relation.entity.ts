import { Entity, Column, PrimaryColumn, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { InternalTable } from './internal_table.entity';

@Entity({ name: 'internal_table_relations' })
export class InternalTableRelation extends BaseEntity {
  // Not generated: every writer sets this explicitly. This is the physical Postgres table name,
  // and it is an identity of its own — independent of internalTableId. Never assume a relation
  // between the two: rows written by the relation backfill migration have them equal, while
  // create_table mints a fresh uuid, so nothing created since has them equal. Both shapes coexist
  // permanently. Resolve a physical name through TooljetDbRelationResolverService; never use a
  // logical internal_tables id as a table name.
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'internal_table_id' })
  internalTableId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  // { columns: { column_names: { [name]: uuid }, configurations: { [uuid]: cfg } } }
  @Column({ type: 'jsonb', name: 'configurations', nullable: true })
  configurations: any;

  // Set by the rollout migration when a table could not be baselined. NULL = baselined fine.
  @Column({ name: 'baseline_error', type: 'text', nullable: true })
  baselineError: string | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => InternalTable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'internal_table_id' })
  internalTable: InternalTable;
}
