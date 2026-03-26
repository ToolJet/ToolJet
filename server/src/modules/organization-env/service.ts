import { Injectable } from '@nestjs/common';
import { GITConnectionType } from 'src/entities/organization_git_sync.entity';
import { IOrganizationEnvRegistryService } from '@modules/organization-env/interfaces/IService';
import { EnvProviderState, GitHttpsEnvConfig, GitLabEnvConfig, GitSshEnvConfig } from '@modules/organization-env/types';

@Injectable()
export class OrganizationEnvRegistryService implements IOrganizationEnvRegistryService {
  async initialize(): Promise<void> {}

  async reload(_organizationId?: string): Promise<void> {}

  hasGitHttpsConfig(_workspaceId: string): boolean {
    return false;
  }

  hasGitSshConfig(_workspaceId: string): boolean {
    return false;
  }

  hasGitLabConfig(_workspaceId: string): boolean {
    return false;
  }

  async getGitHttpsConfig(_workspaceId: string): Promise<GitHttpsEnvConfig | null> {
    return null;
  }

  async getGitSshConfig(_workspaceId: string): Promise<GitSshEnvConfig | null> {
    return null;
  }

  async getGitLabConfig(_workspaceId: string): Promise<GitLabEnvConfig | null> {
    return null;
  }

  async getGitHttpsTemplateConfig(_workspaceId: string): Promise<Partial<GitHttpsEnvConfig> | null> {
    return null;
  }

  async getGitSshTemplateConfig(_workspaceId: string): Promise<Partial<GitSshEnvConfig> | null> {
    return null;
  }

  async getGitLabTemplateConfig(_workspaceId: string): Promise<Partial<GitLabEnvConfig> | null> {
    return null;
  }

  setProviderState(_workspaceId: string, _provider: GITConnectionType, _state: EnvProviderState): void {}

  getProviderState(_workspaceId: string, _provider: GITConnectionType): EnvProviderState {
    return { isEnabled: false, isFinalized: false };
  }

  getActiveProvider(_workspaceId: string): GITConnectionType {
    return GITConnectionType.DISABLED;
  }
}
