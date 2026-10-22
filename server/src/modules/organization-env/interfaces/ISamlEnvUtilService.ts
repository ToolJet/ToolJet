import { EnvProviderState, SamlEnvConfig } from '@modules/organization-env/types';

export interface ISamlEnvUtilService {
  initialize(): Promise<void>;

  hasSamlConfig(organizationId: string): boolean;
  getResolvedOrganizationIds(): string[];

  getSamlConfig(organizationId: string): Promise<SamlEnvConfig | null>;

  getSamlTemplateConfig(organizationId: string): Promise<Partial<SamlEnvConfig> | null>;

  setProviderState(organizationId: string, state: EnvProviderState): void;
  getProviderState(organizationId: string): EnvProviderState;

  ensureResolved(organizationId: string): Promise<void>;
  applyLicenseToResolvedOrgs(): Promise<void>;
}
