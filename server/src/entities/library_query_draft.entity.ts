import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'library_query_drafts' })
// Names are unique among live drafts only.
@Index('IDX_library_query_drafts_live_name', ['libraryQueryId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class LibraryQueryDraft extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'library_query_id', type: 'uuid' })
  libraryQueryId: string;

  @Column({ length: 25 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'created_from_version_id', type: 'uuid', nullable: true })
  createdFromVersionId: string | null;

  @Column()
  kind: string;

  @Column({ name: 'data_source_id', type: 'uuid', nullable: true })
  dataSourceId: string | null;

  @Column({ type: 'jsonb' })
  options: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
