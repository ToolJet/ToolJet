import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { OrganizationGitSync } from './organization_git_sync.entity';
import { App } from './app.entity';

@Entity({ name: 'app_git_sync' })
export class AppGitSync extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'git_app_name', nullable: false })
  gitAppName: string;

  @Column({ name: 'last_commit_id', nullable: true })
  lastCommitId: string;

  @Column({ name: 'last_commit_message', nullable: true })
  lastCommitMessage: string;

  @Column({ name: 'last_commit_user', nullable: true })
  lastCommitUser: string;

  @Column({ name: 'git_app_id', nullable: false })
  gitAppId: string;

  @Column({ name: 'git_version_name', nullable: true })
  gitVersionName: string;

  @Column({ name: 'git_version_id', nullable: true })
  gitVersionId: string;

  @Column({ name: 'organization_git_id', nullable: false })
  organizationGitId: string;

  @Column({ name: 'app_id', nullable: false })
  appId: string;

  @Column({ name: 'version_id', nullable: true })
  versionId: string;

  @Column({ name: 'last_push_date', nullable: true })
  lastPushDate: Date;

  @Column({ name: 'last_pull_date', nullable: true })
  lastPullDate: Date;

  @ManyToOne(() => OrganizationGitSync, (orgGit) => orgGit.id)
  @JoinColumn({ name: 'organization_git_id' })
  orgGit: OrganizationGitSync;

  @OneToOne(() => App, (app) => app.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
