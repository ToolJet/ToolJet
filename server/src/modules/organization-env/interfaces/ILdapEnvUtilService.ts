import { EnvProviderState, LdapEnvConfig } from '@modules/organization-env/types';

export interface ILdapEnvUtilService {
  initialize(): Promise<void>;

  hasLdapConfig(organizationId: string): boolean;
  getResolvedOrganizationIds(): string[];

  getLdapConfig(organizationId: string): Promise<LdapEnvConfig | null>;

  getLdapTemplateConfig(organizationId: string): Promise<Partial<LdapEnvConfig> | null>;

  setProviderState(organizationId: string, state: EnvProviderState): void;
  getProviderState(organizationId: string): EnvProviderState;

  ensureResolved(organizationId: string): Promise<void>;
  applyLicenseToResolvedOrgs(): Promise<void>;
}
