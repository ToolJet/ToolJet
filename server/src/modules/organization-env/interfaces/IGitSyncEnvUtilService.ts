import { EntityManager } from 'typeorm';
import { GITConnectionType } from 'src/entities/organization_git_sync.entity';
import { EnvProviderState, GitHttpsEnvConfig, GitLabEnvConfig } from '@modules/organization-env/types';

export interface IGitSyncEnvUtilService {
  initialize(): Promise<void>;

  hasGitHttpsConfig(workspaceId: string): boolean;
  hasGitLabConfig(workspaceId: string): boolean;

  getGitHttpsConfig(workspaceId: string): Promise<GitHttpsEnvConfig | null>;
  getGitLabConfig(workspaceId: string): Promise<GitLabEnvConfig | null>;

  getGitHttpsTemplateConfig(workspaceId: string): Promise<Partial<GitHttpsEnvConfig> | null>;
  getGitLabTemplateConfig(workspaceId: string): Promise<Partial<GitLabEnvConfig> | null>;

  setProviderState(workspaceId: string, provider: GITConnectionType, state: EnvProviderState): void;
  getProviderState(workspaceId: string, provider: GITConnectionType): EnvProviderState;
  getActiveProvider(workspaceId: string): GITConnectionType;

  // manager — reuse the caller's connection for the lookup (see GetDetailsOptions.manager).
  ensureResolved(workspaceId: string, manager?: EntityManager): Promise<void>;
  applyLicenseToResolvedOrgs(): Promise<void>;
}
