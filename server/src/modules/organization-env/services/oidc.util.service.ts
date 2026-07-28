import { Injectable } from '@nestjs/common';
import { IOidcEnvUtilService } from '@modules/organization-env/interfaces/IOidcEnvUtilService';
import { EnvProviderState, OidcEnvConfig } from '@modules/organization-env/types';

@Injectable()
export class OidcEnvUtilService implements IOidcEnvUtilService {
  async initialize(): Promise<void> {}

  hasOidcConfig(_organizationId: string, _envConfigIndex: number): boolean {
    return false;
  }

  async getOidcConfig(_organizationId: string, _configId: string, _envConfigIndex: number): Promise<OidcEnvConfig | null> {
    return null;
  }

  async getOidcTemplateConfig(_organizationId: string, _envConfigIndex: number): Promise<Partial<OidcEnvConfig> | null> {
    return null;
  }

  async getWorkspaceProviderCount(_organizationId: string): Promise<number> {
    return 0;
  }

  getResolvedWorkspaceOrganizationIds(): string[] {
    return [];
  }

  setProviderState(_configId: string, _state: EnvProviderState): void {}

  getProviderState(_configId: string): EnvProviderState {
    return { isEnabled: false, isFinalized: false };
  }

  async ensureResolved(_organizationId: string): Promise<void> {}

  hasInstanceOidcConfig(): boolean {
    return false;
  }

  async getInstanceOidcConfig(): Promise<OidcEnvConfig | null> {
    return null;
  }

  async getInstanceOidcTemplateConfig(): Promise<Partial<OidcEnvConfig> | null> {
    return null;
  }

  getInstanceProviderState(): EnvProviderState {
    return { isEnabled: false, isFinalized: false };
  }

  async getInstanceGroupSyncMappings(): Promise<
    Array<{ organizationId: string; claimName?: string; groupMapping?: Record<string, string> }>
  > {
    return [];
  }

  async getInstanceGroupSyncTemplateConfig(): Promise<
    Array<{ organizationId: string; claimName?: string; groupMapping?: string }>
  > {
    return [];
  }

  applyLicenseToResolvedOrgs(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
