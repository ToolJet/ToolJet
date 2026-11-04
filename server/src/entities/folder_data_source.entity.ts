import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { DataSource } from './data_source.entity';

@Entity({ name: 'folder_data_sources' })
export class FolderDataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  // Always populated — the table was created after every org already had a default branch, so a
  // data source's folder placement is always branch-scoped. (Contrast folder_apps.branch_id, which
  // was retrofitted nullable and later forced NOT NULL; here it is NOT NULL from the start.)
  //
  // Keyed on (data_source_id, branch_id), NOT data_source_version_id: data_source_versions has
  // UNIQUE(data_source_id, branch_id) so the two are equivalent, but the DSV row id churns
  // (default-branch delete hard-deletes it; dummy/stub reconcile re-creates it), whereas
  // (data_source_id, branch_id) is stable across that churn.
  @Column({ name: 'branch_id' })
  branchId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, (folder) => folder.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;
}
