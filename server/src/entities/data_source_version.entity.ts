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
import { AppVersion } from './app_version.entity';

@Entity({ name: 'data_source_versions' })
@Unique(['dataSourceId', 'branchId'])
export class DataSourceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'version_from_id', nullable: true })
  versionFromId: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'app_version_id', nullable: true })
  appVersionId: string;

  @Column({ name: 'meta_timestamp', type: 'numeric', precision: 15, nullable: true, default: null })
  metaTimestamp: number;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'pulled_at', type: 'timestamp', nullable: true, default: null })
  pulledAt: Date;

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

  @ManyToOne(() => AppVersion, (av) => av.id, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToOne(() => WorkspaceBranch, (wb) => wb.id, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;

  @OneToMany(() => DataSourceVersionOptions, (dsvo) => dsvo.dataSourceVersion)
  dataSourceVersionOptions: DataSourceVersionOptions[];
}
