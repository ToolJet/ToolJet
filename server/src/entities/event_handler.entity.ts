import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AppVersion } from './app_version.entity';

export enum Target {
  page = 'page',
  component = 'component',
  dataQuery = 'data_query',
  tableColumn = 'table_column',
  tableAction = 'table_action',
}

@Entity({ name: 'event_handlers' })
@Index('idx_event_handler_app_version_id', ['appVersionId'])
@Index('idx_event_handler_source_id', ['sourceId'])
@Index('idx_event_handler_created_at', ['createdAt'])
export class EventHandler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  index: number;

  @Column('simple-json')
  event: any;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column()
  target: Target;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.pages)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;
}
