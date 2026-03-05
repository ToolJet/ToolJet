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

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (ds) => ds.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => WorkspaceBranch, (wb) => wb.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;

  @OneToMany(() => DataSourceVersionOptions, (dsvo) => dsvo.dataSourceVersion)
  dataSourceVersionOptions: DataSourceVersionOptions[];
}
