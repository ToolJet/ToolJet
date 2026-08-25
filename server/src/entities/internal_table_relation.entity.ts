import { Entity, Column, PrimaryColumn, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { InternalTable } from './internal_table.entity';

@Entity({ name: 'internal_table_relations' })
export class InternalTableRelation extends BaseEntity {
  // Not generated: every writer sets this explicitly. Currently always equals internalTableId —
  // a relation does not yet have an identity independent of the logical table it belongs to.
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
