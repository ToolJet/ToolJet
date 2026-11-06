import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'library_query_versions' })
// Names are unique among live versions only; version numbers stay unique even after a soft delete.
@Index('IDX_library_query_versions_live_name', ['libraryQueryId', 'name'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Unique('UQ_library_query_versions_query_number', ['libraryQueryId', 'versionNumber'])
export class LibraryQueryVersion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'library_query_id', type: 'uuid' })
  libraryQueryId: string;

  @Column({ length: 25 })
  name: string;

  @Column({ name: 'version_number', type: 'integer' })
  versionNumber: number;

  @Column({ name: 'kind' })
  kind: string;

  @Column({ name: 'data_source_id', type: 'uuid', nullable: true })
  dataSourceId: string | null;

  @Column({ name: 'options', type: 'jsonb' })
  options: Record<string, unknown>;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  // Environment this version has been promoted to; null until promoted (a promote/release gate only).
  @Column({ name: 'current_environment_id', type: 'uuid', nullable: true })
  currentEnvironmentId: string | null;

  @Column({ name: 'created_from_version_id', type: 'uuid', nullable: true })
  createdFromVersionId: string | null;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  // Soft delete: reads skip deleted rows by default; the next-number lookup counts them (raw SQL).
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
