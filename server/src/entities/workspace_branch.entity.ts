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
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_git_sync_branches' })
@Unique(['organizationId', 'name'])
export class WorkspaceBranch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_name' })
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'source_branch_id', nullable: true })
  sourceBranchId: string;

  @Column({ name: 'created_by', nullable: true, default: null })
  createdBy: string;

  // Git-sync change tokens (git-native). last_synced_commit is the branch HEAD we
  // last pulled — equal to the remote HEAD ⇒ skip the whole pull without cloning.
  // The *_git_tree_sha columns are the tree SHAs of apps/, modules/, data-sources/
  // — equal ⇒ skip that whole category. Written only after the matching level
  // imports with zero errors, so a failure leaves the old value and forces a retry.
  @Column({ name: 'last_synced_commit', type: 'varchar', length: 64, nullable: true, default: null })
  lastSyncedCommit: string;

  @Column({ name: 'apps_git_tree_sha', type: 'varchar', length: 64, nullable: true, default: null })
  appsGitTreeSha: string;

  @Column({ name: 'modules_git_tree_sha', type: 'varchar', length: 64, nullable: true, default: null })
  modulesGitTreeSha: string;

  @Column({ name: 'data_sources_git_tree_sha', type: 'varchar', length: 64, nullable: true, default: null })
  dataSourcesGitTreeSha: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (org) => org.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => WorkspaceBranch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch: WorkspaceBranch;
}
