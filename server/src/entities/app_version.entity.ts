import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  Unique,
  OneToMany,
} from 'typeorm';
import { App } from './app.entity';
import { DataQuery } from './data_query.entity';
import { DataSource } from './data_source.entity';
import { Page } from './page.entity';
import { EventHandler } from './event_handler.entity';

@Entity({ name: 'app_versions' })
@Unique(['name', 'appId'])
export class AppVersion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('simple-json', { name: 'definition' })
  definition;

  @Column('simple-json', { name: 'global_settings' })
  globalSettings;

  @Column({ name: 'show_viewer_navigation' })
  showViewerNavigation: boolean;

  @Column({ name: 'home_page_id' })
  homePageId: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'current_environment_id' })
  currentEnvironmentId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @OneToMany(() => DataSource, (dataSource) => dataSource.appVersion)
  dataSources: DataSource[];

  @OneToMany(() => DataQuery, (dataQuery) => dataQuery.appVersion)
  dataQueries: DataQuery[];

  @OneToMany(() => Page, (page) => page.appVersion, { onDelete: 'CASCADE' })
  pages: Page[];

  @OneToMany(() => EventHandler, (eventHandler) => eventHandler.appVersion, {
    onDelete: 'CASCADE',
  })
  eventHandlers: EventHandler[];
}
