import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { DataSource } from './data_source.entity';

@Entity({ name: 'library_queries' })
@Unique('UQ_library_queries_workspace_name', ['organizationId', 'name'])
export class LibraryQuery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column()
  name: string;

  @Column()
  kind: string;

  @Column({ name: 'data_source_id', type: 'uuid', nullable: true })
  dataSourceId: string | null;

  @Column({ type: 'jsonb' })
  options: Record<string, unknown>;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId: string | null;

  @Column({ name: 'co_relation_id', type: 'uuid', nullable: true })
  coRelationId: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource | null;
}
