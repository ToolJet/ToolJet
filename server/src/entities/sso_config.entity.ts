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

interface Form {
  enableSignUp?: boolean;
}

@Entity({ name: 'sso_configs' })
export class SSOConfigs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'sso' })
  sso: 'google' | 'git' | 'okta' | 'form';

  @Column({ type: 'json' })
  configs: Google | Git | Okta | Form | any;

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
