import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  OneToMany,
  JoinTable,
  ManyToMany,
  AfterLoad,
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';
import { DataQuery } from './data_query.entity';
import { DataSourceGroupPermission } from './data_source_group_permission.entity';
import { DataSourceOptions } from './data_source_options.entity';
import { GroupPermission } from './group_permission.entity';
import { Plugin } from './plugin.entity';
import { GroupDataSources } from './group_data_source.entity';
import { DataSourceTypes } from '@modules/data-sources/constants';

@Entity({ name: 'data_sources' })
export class DataSource extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'kind' })
  kind: string;

  @Column({
    type: 'enum',
    enumName: 'type',
    name: 'type',
    enum: [DataSourceTypes.STATIC, DataSourceTypes.DEFAULT, DataSourceTypes.SAMPLE],
    default: DataSourceTypes.DEFAULT,
  })
  type: string;

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'enum', enumName: 'scope', enum: ['local', 'global'], default: 'local' })
  scope: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToMany(() => App)
  @JoinTable({
    name: 'app_versions',
    joinColumn: {
      name: 'id',
      referencedColumnName: 'appVersionId',
    },
    inverseJoinColumn: {
      name: 'app_id',
      referencedColumnName: 'id',
    },
  })
  apps: App[];

  app: App;

  @ManyToMany(() => GroupPermission)
  @JoinTable({
    name: 'data_source_group_permissions',
    joinColumn: {
      name: 'data_source_id',
    },
    inverseJoinColumn: {
      name: 'group_permission_id',
    },
  })
  groupPermissions: GroupPermission[];

  @OneToMany(() => DataSourceGroupPermission, (dataSourceGroupPermission) => dataSourceGroupPermission.dataSource, {
    onDelete: 'CASCADE',
  })
  dataSourceGroupPermissions: DataSourceGroupPermission[];

  @OneToMany(() => GroupDataSources, (groupDataSources) => groupDataSources.dataSource, { onDelete: 'CASCADE' })
  dataSourceGroups: GroupDataSources[];

  @ManyToOne(() => Plugin, (plugin) => plugin.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plugin_id' })
  plugin: Plugin;

  @OneToMany(() => DataSourceOptions, (dso) => dso.dataSource)
  dataSourceOptions: DataSourceOptions[];

  @OneToMany(() => DataQuery, (dq) => dq.dataSource)
  dataQueries: DataQuery[];

  options: any;

  @AfterLoad()
  updateApp() {
    if (this.apps?.length) this.app = this.apps[0];
  }
}
