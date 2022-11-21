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
} from 'typeorm';
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

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => Plugin)
  @JoinTable({
    name: 'data_sources',
    joinColumn: {
      name: 'id',
      referencedColumnName: 'data_source_id',
    },
    inverseJoinColumn: {
      name: 'plugin_id',
      referencedColumnName: 'id',
    },
  })
  plugin: Plugin;
}
