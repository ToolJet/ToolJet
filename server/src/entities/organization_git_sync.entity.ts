import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  JoinTable,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppGitSync } from './app_git_sync.entity';
import { Organization } from './organization.entity';
import { OrganizationGitSsh } from './gitsync_entities/organization_git_ssh.entity';
import { OrganizationGitHttps } from './gitsync_entities/organization_git_https.entity';
import { OrganizationGitLab } from './gitsync_entities/organization_gitlab.entity';
import { WorkspaceBranch } from './workspace_branch.entity';
export enum GITConnectionType {
  GITHUB_SSH = 'github_ssh',
  GITHUB_HTTPS = 'github_https',
  GITLAB = 'gitlab',
  DISABLED = 'disabled',
}
@Entity({ name: 'organization_git_sync' })
export class OrganizationGitSync extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: false })
  organizationId: string;

  @Column({ name: 'auto_commit', nullable: false, default: false })
  autoCommit: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_branching_enabled', nullable: false, default: true })
  isBranchingEnabled: boolean;

  @Column({ name: 'schema_version', nullable: false, default: '1.0.0' })
  schemaVersion: string;

  @Column({ name: 'active_branch_id', nullable: true })
  activeBranchId: string;

  @ManyToOne(() => WorkspaceBranch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'active_branch_id' })
  activeBranch: WorkspaceBranch;

  @OneToMany(() => AppGitSync, (appGitSync) => appGitSync.orgGit, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'app_git_sync',
    joinColumn: {
      name: 'id',
    },
    inverseJoinColumn: {
      name: 'organization_git_id',
    },
  })
  appGitSync: AppGitSync[];

  @OneToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToOne(() => OrganizationGitSsh, (gitSsh) => gitSsh.orgGitSync, {})
  gitSsh: OrganizationGitSsh;

  @OneToOne(() => OrganizationGitHttps, (gitHttps) => gitHttps.orgGitSync, {})
  gitHttps: OrganizationGitHttps;

  @OneToOne(() => OrganizationGitLab, (gitLab) => gitLab.orgGitSync, {})
  gitLab: OrganizationGitLab;
}
