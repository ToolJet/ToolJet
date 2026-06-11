import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DataSource } from './data_source.entity';
import { DataSourcesGroupPermissions } from './data_sources_group_permissions.entity';

@Entity({ name: 'group_data_sources' })
export class GroupDataSources extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'data_sources_group_permissions_id' })
  dataSourcesGroupPermissionsId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id)
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => DataSourcesGroupPermissions, (dataSourcePermissions) => dataSourcePermissions.id)
  @JoinColumn({ name: 'data_sources_group_permissions_id' })
  dataSourcesGroupPermissions: DataSourcesGroupPermissions;
}
