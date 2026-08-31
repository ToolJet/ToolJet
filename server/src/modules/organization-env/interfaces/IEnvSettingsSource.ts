import { EnvProviderState } from '@modules/organization-env/types';

export interface IEnvSettingsSource<T> {
  initialize(): Promise<void>;
  ensureResolved(organizationId: string): Promise<void>;
  getResolvedOrganizationIds(): string[];

  hasConfig(organizationId: string): boolean;
  getConfig(organizationId: string): Promise<T | null>;
  getTemplateConfig(organizationId: string): Promise<Partial<T> | null>;

  setProviderState(organizationId: string, state: EnvProviderState): void;
  getProviderState(organizationId: string): EnvProviderState;

  applyLicenseToResolvedOrgs(): Promise<void>;
}
