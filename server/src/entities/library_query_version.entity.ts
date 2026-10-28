import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'library_query_versions' })
export class LibraryQueryVersion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_query_id' })
  dataQueryId: string;

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

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  // Soft delete: reads skip deleted rows by default; the next-number lookup counts them (raw SQL).
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
