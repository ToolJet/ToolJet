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

@Entity('organization_gitlab')
export class OrganizationGitLab extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gitlab_url' })
  gitlabUrl: string;

  @Column({ name: 'gitlab_branch' })
  gitlabBranch: string;

  @Column({ name: 'gitlab_project_id' })
  gitlabProjectId: string;

  @Column({ name: 'gitlab_project_access_token', nullable: true, default: null })
  @IsOptional()
  gitlabProjectAccessToken: string;

  @Column({ name: 'gitlab_enterprise_url', nullable: true, default: null })
  @IsOptional()
  gitlabEnterpriseUrl: string;

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
