import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

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

@Entity({ name: 'sso_configs' })
export class SSOConfigs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'sso' })
  sso: 'google' | 'git' | 'form' | 'openid' | 'ldap';

  @Column({ type: 'json' })
  configs: Google | Git | OpenId | LDAP;

  @Column({ name: 'enabled' })
  enabled: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
