import { Injectable } from '@nestjs/common';
import { ILdapEnvUtilService } from '@modules/organization-env/interfaces/ILdapEnvUtilService';
import { EnvProviderState, LdapEnvConfig } from '@modules/organization-env/types';

@Injectable()
export class LdapEnvUtilService implements ILdapEnvUtilService {
  async initialize(): Promise<void> {}

  hasLdapConfig(_organizationId: string): boolean {
    return false;
  }

  getResolvedOrganizationIds(): string[] {
    return [];
  }

  async getLdapConfig(_organizationId: string): Promise<LdapEnvConfig | null> {
    return null;
  }

  async getLdapTemplateConfig(_organizationId: string): Promise<Partial<LdapEnvConfig> | null> {
    return null;
  }

  setProviderState(_organizationId: string, _state: EnvProviderState): void {}

  getProviderState(_organizationId: string): EnvProviderState {
    return { isEnabled: false, isFinalized: false };
  }

  async ensureResolved(_organizationId: string): Promise<void> {}

  applyLicenseToResolvedOrgs(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
