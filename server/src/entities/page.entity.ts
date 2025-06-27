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
import { PagePermission } from './page_permissions.entity';

export enum PageOpenIn {
  NEW_TAB = 'new_tab',
  SAME_TAB = 'same_tab',
}

export enum PageType {
  DEFAULT = 'default',
  GROUP = 'group',
  URL = 'url',
  APP = 'app',
}

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

  @Column('jsonb', { name: 'hidden' })
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

  @Column({ name: 'url', type: 'varchar', nullable: true })
  url: string | null;

  @Column({
    type: 'enum',
    enum: PageOpenIn,
    name: 'open_in',
    default: PageOpenIn.SAME_TAB,
  })
  openIn: PageOpenIn;

  @Column({
    type: 'enum',
    enum: PageType,
    name: 'type',
    default: PageType.DEFAULT,
  })
  type: PageType;

  @Column({ name: 'app_id', type: 'varchar', nullable: true }) // Assuming appId is a varchar/string
  appId: string | null;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.pages)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @OneToMany(() => Component, (component) => component.page)
  components: Component[];

  @OneToMany(() => PagePermission, (permission) => permission.page)
  permissions: PagePermission[];
}
