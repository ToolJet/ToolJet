import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { AppVersion } from './app_version.entity';
import { Component } from './component.entity';

@Entity({ name: 'pages' })
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  AppVersionId: string;

  @Column()
  updateId: string;

  @Column()
  lastHashedDiff: string;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.pages)
  appVersion: AppVersion;

  @OneToMany(() => Component, (component) => component.page)
  components: Component[];
}
