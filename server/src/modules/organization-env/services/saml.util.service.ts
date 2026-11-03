import { Injectable } from '@nestjs/common';
import { ISamlEnvUtilService } from '@modules/organization-env/interfaces/ISamlEnvUtilService';
import { EnvProviderState, SamlEnvConfig } from '@modules/organization-env/types';

@Injectable()
export class SamlEnvUtilService implements ISamlEnvUtilService {
  async initialize(): Promise<void> {}

  hasSamlConfig(_organizationId: string): boolean {
    return false;
  }

  getResolvedOrganizationIds(): string[] {
    return [];
  }

  async getSamlConfig(_organizationId: string): Promise<SamlEnvConfig | null> {
    return null;
  }

  async getSamlTemplateConfig(_organizationId: string): Promise<Partial<SamlEnvConfig> | null> {
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
