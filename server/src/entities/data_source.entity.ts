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
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';
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

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToOne((type) => App)
  @JoinTable({
    name: 'app_versions',
    joinColumn: {
      name: 'id',
      referencedColumnName: 'app_version_id',
    },
    inverseJoinColumn: {
      name: 'app_id',
      referencedColumnName: 'id',
    },
  })
  app: App;

  @ManyToOne(() => Plugin, (plugin) => plugin.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plugin_id' })
  plugin: Plugin;

  @OneToMany(() => DataSourceOptions, (dso) => dso.dataSource)
  dataSourceOptions: DataSourceOptions[];

  options;
}
