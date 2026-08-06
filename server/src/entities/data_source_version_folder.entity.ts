import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Folder } from './folder.entity';
import { DataSourceVersion } from './data_source_version.entity';

/**
 * Maps a folder to a data source *version* — not the data-source root.
 *
 * data_source_versions is unique on (data_source_id, branch_id): exactly one row per data
 * source per branch. So the version id bijectively encodes (dataSource, branch), and pointing
 * the mapping at the version carries the branch with zero duplication and no NULL/UUID branch
 * convention.
 *
 * This intentionally diverges from folder_apps, which keys on the app root + a separate
 * branch_id column. That shape exists because app_versions is unique on (name, branch_id) —
 * many versions per (app, branch) — so there is no single version row to reference. Data
 * sources don't have that problem, so the cleaner version-mapping applies here.
 *
 * UNIQUE(data_source_version_id): a data source lives in at most one folder per branch.
 * Both FKs are ON DELETE CASCADE, so the row self-cleans when the folder is deleted or when
 * the DSV disappears (branch deleted, DS deleted, or dummy→real reconciliation).
 */
@Entity({ name: 'data_source_version_folders' })
@Unique('UQ_data_source_version_folders_dsv', ['dataSourceVersionId'])
export class DataSourceVersionFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @Column({ name: 'data_source_version_id' })
  dataSourceVersionId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, (folder) => folder.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => DataSourceVersion, (dsv) => dsv.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_version_id' })
  dataSourceVersion: DataSourceVersion;
}
