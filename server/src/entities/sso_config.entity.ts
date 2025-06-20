import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { SsoConfigOidcGroupSync } from './sso_config_oidc_group_sync.entity';

type Google = {
  clientId: string;
};
type Git = {
  clientId: string;
  clientSecret: string;
  hostName?: string;
};
type OpenId = {
  clientId: string;
  clientSecret: string;
  name: string;
  wellKnownUrl: string;
  claimName: string;
  groupMapping: { [key: string]: string };
  enableGroupSync: boolean;
  enableShortSession: boolean;
};
type LDAP = {
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  sslOptions: {
    clientKey: string;
    clientCert: string;
    serverCert: string;
  };
  basedn: string;
};
type SAML = {
  name: string;
  idpMetadata: string;
  groupAttribute: string;
};
export enum SSOType {
  GOOGLE = 'google',
  GIT = 'git',
  FORM = 'form',
  OPENID = 'openid',
  LDAP = 'ldap',
  SAML = 'saml',
}

export enum ConfigScope {
  ORGANIZATION = 'organization',
  INSTANCE = 'instance',
}

@Entity({ name: 'sso_configs' })
export class SSOConfigs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string | null;

  @Column({
    name: 'sso',
    type: 'enum',
    enum: SSOType,
    enumName: 'sso_type_enum',
  })
  sso: SSOType;

  @Column({
    name: 'config_scope',
    type: 'enum',
    enum: ConfigScope,
    enumName: 'config_scope_enum',
  })
  configScope: ConfigScope;

  @Column({ type: 'json' })
  configs: Google | Git | OpenId | LDAP | SAML;

  @Column({ name: 'enabled' })
  enabled: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => SsoConfigOidcGroupSync, (groupSync) => groupSync.ssoConfig)
  @JoinColumn({ name: 'sso_config_id', referencedColumnName: 'id' })
  oidcGroupSyncs: SsoConfigOidcGroupSync[];
}
