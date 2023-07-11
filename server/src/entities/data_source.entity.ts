import { DataSourceTypes } from 'src/helpers/data_source.constants';
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
import { DataSourceOptions } from './data_source_options.entity';
import { Plugin } from './plugin.entity';

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
    enum: [DataSourceTypes.STATIC, DataSourceTypes.DEFAULT],
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

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id, { onDelete: 'CASCADE' })
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
