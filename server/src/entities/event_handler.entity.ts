import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AppVersion } from './app_version.entity';

enum Target {
  page = 'page',
  component = 'component',
  dataQuery = 'data_query',
}

@Entity({ name: 'event_handlers' })
export class EventHandler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'app_version_id' })
  AppVersionId: string;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column({ name: 'target' })
  target: Target;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.eventHandlers)
  appVersion: AppVersion;
}
