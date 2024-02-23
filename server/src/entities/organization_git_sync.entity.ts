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
  JoinColumn,
} from 'typeorm';
import { AppGitSync } from './app_git_sync.entity';
import { Organization } from './organization.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'organization_git_sync' })
export class OrganizationGitSync extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'git_url', nullable: false })
  gitUrl: string;

  @Column({ name: 'organization_id', nullable: false })
  organizationId: string;

  @Column({ name: 'is_enabled', nullable: false, default: false })
  isEnabled: boolean;

  @Column({ name: 'is_finalized', nullable: false, default: false })
  isFinalized: boolean;

  @Exclude()
  @Column({ name: 'ssh_private_key' })
  sshPrivateKey: string;

  @Column({ name: 'ssh_public_key' })
  sshPublicKey: string;

  @Column({ name: 'auto_commit', nullable: false, default: false })
  autoCommit: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'key_type',
    type: 'enum',
    enumName: 'ssh_key_type',
    enum: ['rsa', 'ed25519'],
    default: 'ed25519',
  })
  keyType: string;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

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
}
