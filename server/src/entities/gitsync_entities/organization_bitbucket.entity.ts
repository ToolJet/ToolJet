import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { OrganizationGitSync } from '../organization_git_sync.entity';
import { IsOptional } from 'class-validator';

@Entity('organization_bitbucket')
export class OrganizationBitbucket extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bitbucket_workspace' })
  bitbucketWorkspace: string;

  @Column({ name: 'bitbucket_repo_slug' })
  bitbucketRepoSlug: string;

  @Column({ name: 'bitbucket_branch' })
  bitbucketBranch: string;

  @Column({ name: 'bitbucket_access_token', nullable: true, default: null })
  @IsOptional()
  bitbucketAccessToken: string;

  @Column({ name: 'config_id' })
  configId: string;

  @Column({ name: 'is_finalized', nullable: false, default: false })
  isFinalized: boolean;

  @Column({ name: 'is_enabled', nullable: false, default: false })
  isEnabled: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => OrganizationGitSync)
  @JoinColumn({ name: 'config_id' })
  orgGitSync: OrganizationGitSync;
}
