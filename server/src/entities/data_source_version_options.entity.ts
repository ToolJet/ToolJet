import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DataSourceVersion } from './data_source_version.entity';
import { AppEnvironment } from './app_environments.entity';

@Entity({ name: 'data_source_version_options' })
@Unique(['dataSourceVersionId', 'environmentId'])
export class DataSourceVersionOptions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_version_id' })
  dataSourceVersionId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column('simple-json', { name: 'options', default: '{}' })
  options: any;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSourceVersion, (dsv) => dsv.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_version_id' })
  dataSourceVersion: DataSourceVersion;

  @ManyToOne(() => AppEnvironment, (ae) => ae.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'environment_id' })
  appEnvironment: AppEnvironment;
}
