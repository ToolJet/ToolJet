import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';

export enum ResourceMappingType {
  DEFAULT_DATA_SOURCE_ID_MAPPING = 'defaultDataSourceIdMapping',
  DATA_QUERY_MAPPING = 'dataQueryMapping',
  APP_VERSION_MAPPING = 'appVersionMapping',
  APP_ENVIRONMENT_MAPPING = 'appEnvironmentMapping',
  APP_DEFAULT_ENVIRONMENT_MAPPING = 'appDefaultEnvironmentMapping',
  PAGES_MAPPING = 'pagesMapping',
  COMPONENTS_MAPPING = 'componentsMapping',
}

@Entity({ name: 'app_version_resource_mappings' })
@Index(['appId', 'appVersionId', 'resourceType'])
export class AppVersionResourceMapping extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id', type: 'uuid', nullable: false })
  appId: string;

  @Column({ name: 'app_version_id', type: 'uuid', nullable: false })
  appVersionId: string;

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: ResourceMappingType,
    nullable: false,
  })
  resourceType: ResourceMappingType;

  @Column({
    name: 'resource_mappings',
    type: 'jsonb',
    nullable: false,
    comment: 'Stores mappings for data queries, components, pages, environments, etc.',
  })
  resourceMappings: Record<string, string>;

  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => AppVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @CreateDateColumn({ name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;
}
