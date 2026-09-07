import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { DataSource } from './data_source.entity';
import { WorkspaceBranch } from './workspace_branch.entity';
import { DataSourceVersionOptions } from './data_source_version_options.entity';

@Entity({ name: 'data_source_versions' })
@Unique(['dataSourceId', 'branchId'])
export class DataSourceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'version_from_id', nullable: true })
  versionFromId: string;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Static origin marker: true when the row originated from git sync (branch_id was set
  // before backfill). Added in MakeDataSourceVersionBranchIdNotNullAndDropIsDefault.
  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  // Git-sync change token: git tree SHA of data-sources/<ds>/ that was last
  // applied to this DSV. Pull skips the per-env options re-apply when the incoming
  // tree SHA matches this and is_synced is true.
  @Column({ name: 'git_tree_sha', type: 'varchar', length: 64, nullable: true, default: null })
  gitTreeSha: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (ds) => ds.dataSourceVersions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => DataSourceVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'version_from_id' })
  versionFrom: DataSourceVersion;

  @ManyToOne(() => WorkspaceBranch, (wb) => wb.id, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;

  @OneToMany(() => DataSourceVersionOptions, (dsvo) => dsvo.dataSourceVersion)
  dataSourceVersionOptions: DataSourceVersionOptions[];
}
