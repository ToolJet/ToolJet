import { GITConnectionType } from 'src/entities/organization_git_sync.entity';
import { EnvProviderState, GitHttpsEnvConfig, GitLabEnvConfig, GitSshEnvConfig } from '@modules/organization-env/types';

export interface IOrganizationEnvRegistryService {
  initialize(): Promise<void>;
  reload(organizationId?: string): Promise<void>;
  hasGitHttpsConfig(workspaceId: string): boolean;
  hasGitSshConfig(workspaceId: string): boolean;
  hasGitLabConfig(workspaceId: string): boolean;
  getGitHttpsConfig(workspaceId: string): Promise<GitHttpsEnvConfig | null>;
  getGitSshConfig(workspaceId: string): Promise<GitSshEnvConfig | null>;
  getGitLabConfig(workspaceId: string): Promise<GitLabEnvConfig | null>;
  getGitHttpsTemplateConfig(workspaceId: string): Promise<Partial<GitHttpsEnvConfig> | null>;
  getGitSshTemplateConfig(workspaceId: string): Promise<Partial<GitSshEnvConfig> | null>;
  getGitLabTemplateConfig(workspaceId: string): Promise<Partial<GitLabEnvConfig> | null>;
  setProviderState(workspaceId: string, provider: GITConnectionType, state: EnvProviderState): void;
  getProviderState(workspaceId: string, provider: GITConnectionType): EnvProviderState;
  getActiveProvider(workspaceId: string): GITConnectionType;
}
