import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationGitSync } from '../organization_git_sync.entity';

@Entity('organization_git_ssh')
export class OrganizationGitSsh {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'git_url' })
  gitUrl: string;

  @Column({ name: 'ssh_private_key' })
  sshPrivateKey: string;

  @Column({ name: 'ssh_public_key' })
  sshPublicKey: string;

  @Column({
    name: 'key_type',
    type: 'enum',
    enumName: 'ssh_key_type',
    enum: ['rsa', 'ed25519'],
    default: 'ed25519',
  })
  keyType: string;

  @Column({ name: 'config_id' })
  configId: string;

  @Column({ name: 'is_finalized', nullable: false, default: false })
  isFinalized: boolean;

  // defines foreign key relation
  @OneToOne(() => OrganizationGitSync, (orgGit) => orgGit.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'config_id' })
  orgGit: OrganizationGitSync;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => OrganizationGitSync, (orgGitSync) => orgGitSync.gitSsh)
  @JoinColumn({ name: 'config_id' })
  orgGitSync: OrganizationGitSync;
}
