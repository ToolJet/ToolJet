import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';

interface Google {
  clientId: string;
}
interface Git {
  clientId: string;
  clientSecret: string;
}
interface Okta {
  clientId: string;
  clientSecret: string;
  domain: string;
  redirectUri: string;
  authServer?: string;
}

@Entity({ name: 'sso_configs' })
export class SSOConfigs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'sso' })
  sso: string;

  @Column({ type: 'json' })
  configs: Google | Git | Okta;

  @Column({ type: 'enum', enumName: 'status', enum: ['enable', 'disable'] })
  status: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.ssoConfigs)
  organization: Organization;
}
