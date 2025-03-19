import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppVersion } from './app_version.entity';
import { Component } from './component.entity';

@Entity({ name: 'pages' })
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'page_handle' })
  handle: string;

  @Column()
  index: number;

  @Column()
  disabled: boolean;

  @Column('simple-json', { name: 'hidden' })
  hidden;

  @Column()
  icon: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'auto_compute_layout' })
  autoComputeLayout: boolean;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column({ name: 'page_group_index' })
  pageGroupIndex: number;

  @Column({ name: 'page_group_id' })
  pageGroupId: string;

  @Column({ name: 'is_page_group', default: false })
  isPageGroup: boolean;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.pages)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @OneToMany(() => Component, (component) => component.page)
  components: Component[];
}
