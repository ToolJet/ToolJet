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
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { App } from './app.entity';
import { DataQuery } from './data_query.entity';

@Entity({ name: 'app_versions' })
@Unique(['name', 'appId'])
export class AppVersion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('simple-json', { name: 'definition' })
  definition;

  @Column({ name: 'app_id' })
  appId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToMany(() => DataQuery)
  @JoinTable({
    name: 'data_sources',
    joinColumn: {
      name: 'app_version_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'id',
      referencedColumnName: 'dataSourceId',
    },
  })
  dataQueries: DataQuery[];
}
