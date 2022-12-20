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
import { AppEnvironment } from './app_environments.entity';
import { DataSource } from './data_source.entity';

@Entity({ name: 'data_source_options' })
@Unique(['dataSourceId', 'environmentId'])
export class DataSourceOptions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column('simple-json', { name: 'options' })
  options;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (ds) => ds.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => AppEnvironment, (ae) => ae.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'environment_id' })
  appEnvironment: AppEnvironment;
}
