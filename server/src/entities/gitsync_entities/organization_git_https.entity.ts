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

@Entity('organization_git_https')
export class OrganizationGitHttps extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'https_url' })
  httpsUrl: string;

  @Column({ name: 'github_branch' })
  githubBranch: string;

  @Column({ name: 'github_app_id' })
  githubAppId: string;

  @Column({ name: 'github_installation_id' })
  githubInstallationId: string;

  @Column({ name: 'github_private_key' })
  githubPrivateKey: string;

  @Column({ name: 'github_enterprise_url', default: null })
  @IsOptional()
  githubEnterpriseUrl: string;

  @Column({ name: 'github_enterprise_api_url', default: null })
  @IsOptional()
  githubEnterpriseApiUrl: string;

  @Column({ name: 'config_id' })
  configId: string;

  @JoinColumn({ name: 'config_id' })
  orgGit: OrganizationGitSync;

  @Column({ name: 'is_finalized', nullable: false, default: false })
  isFinalized: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => OrganizationGitSync, (orgGitSync) => orgGitSync.gitHttps)
  @JoinColumn({ name: 'config_id' })
  orgGitSync: OrganizationGitSync;
}
