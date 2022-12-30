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
import { DataSource } from './data_source.entity';
import { Plugin } from './plugin.entity';

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

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

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

  @AfterLoad()
  updatePlugin() {
    if (this.plugins?.length) this.plugin = this.plugins[0];
  }

  @AfterLoad()
  updateKind() {
    this.kind = this.dataSource?.kind;
  }
}
