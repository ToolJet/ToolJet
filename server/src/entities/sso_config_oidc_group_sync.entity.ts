import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { SSOConfigs } from './sso_config.entity';

@Entity('sso_config_oidc_group_sync')
export class SsoConfigOidcGroupSync {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SSOConfigs, (ssoConfig:SSOConfigs) => ssoConfig.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sso_config_id' })
  ssoConfig: SSOConfigs;

  @Column({ name: 'sso_config_id', type: 'uuid' })
  ssoConfigId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'claim_name', type: 'varchar' })
  claimName: string;

  @Column({ name: 'group_mappings', type: 'jsonb' })
  groupMappings: Record<string, string>;

  @Column({ name: 'is_group_sync_enabled', type: 'boolean', nullable: true })
  isGroupSyncEnabled: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
