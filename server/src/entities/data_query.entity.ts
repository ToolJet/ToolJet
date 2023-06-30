import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  JoinTable,
  ManyToMany,
  AfterLoad,
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';
import { DataSource } from './data_source.entity';
import { Plugin } from './plugin.entity';
import { DATA_QUERY_STATUS } from 'src/helpers/queries';

@Entity({ name: 'data_queries' })
export class DataQuery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('simple-json', { name: 'options' })
  options;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: Object.values(DATA_QUERY_STATUS),
    default: 'draft',
  })
  status: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToMany(() => Plugin)
  @JoinTable({
    name: 'data_sources',
    joinColumn: {
      name: 'id',
      referencedColumnName: 'dataSourceId',
    },
    inverseJoinColumn: {
      name: 'plugin_id',
      referencedColumnName: 'id',
    },
  })
  plugins: Plugin[];

  plugin: Plugin;

  kind: string;

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

  @AfterLoad()
  updatePlugin() {
    if (this.plugins?.length) this.plugin = this.plugins[0];
  }

  @AfterLoad()
  updateKind() {
    this.kind = this.dataSource?.kind;
  }

  @AfterLoad()
  updateApp() {
    if (this.apps?.length) this.app = this.apps[0];
  }
}
