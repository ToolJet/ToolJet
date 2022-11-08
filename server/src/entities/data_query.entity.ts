import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';
import { DataSource } from './data_source.entity';
import { Plugin } from './plugin.entity';

@Entity({ name: 'data_queries' })
export class DataQuery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'kind' })
  kind: string;

  @Column('simple-json', { name: 'options' })
  options;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, (app) => app.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id)
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => Plugin, (plugin) => plugin.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plugin_id' })
  plugin: Plugin;
}
