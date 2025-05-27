import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
} from 'typeorm';
import { SSOConfigs } from './sso_config.entity';

@Entity('sso_config_oidc_group_sync')
export class SsoConfigOidcGroupSync {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SSOConfigs, (ssoConfig) => ssoConfig.oidcGroupSyncs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sso_config_id' })
  ssoConfig: SSOConfigs;

  @RelationId((groupSync: SsoConfigOidcGroupSync) => groupSync.ssoConfig)
  ssoConfigId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'claim_name', type: 'varchar' })
  claimName: string;

  @Column({ name: 'group_mapping', type: 'jsonb' })
  groupMapping: Record<string, string>;

  @Column({ name: 'enable_group_sync', type: 'boolean', nullable: true })
  enableGroupSync: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
