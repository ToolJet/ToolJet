import { GITConnectionType } from 'src/entities/organization_git_sync.entity';
import {
  EnvProviderState,
  GitHttpsEnvConfig,
  GitLabEnvConfig,
  BitbucketEnvConfig,
} from '@modules/organization-env/types';

export interface IGitSyncEnvUtilService {
  initialize(): Promise<void>;

  hasGitHttpsConfig(workspaceId: string): boolean;
  hasGitLabConfig(workspaceId: string): boolean;
  hasBitbucketConfig(workspaceId: string): boolean;

  getGitHttpsConfig(workspaceId: string): Promise<GitHttpsEnvConfig | null>;
  getGitLabConfig(workspaceId: string): Promise<GitLabEnvConfig | null>;
  getBitbucketConfig(workspaceId: string): Promise<BitbucketEnvConfig | null>;

  getGitHttpsTemplateConfig(workspaceId: string): Promise<Partial<GitHttpsEnvConfig> | null>;
  getGitLabTemplateConfig(workspaceId: string): Promise<Partial<GitLabEnvConfig> | null>;
  getBitbucketTemplateConfig(workspaceId: string): Promise<Partial<BitbucketEnvConfig> | null>;

  setProviderState(workspaceId: string, provider: GITConnectionType, state: EnvProviderState): void;
  getProviderState(workspaceId: string, provider: GITConnectionType): EnvProviderState;
  getActiveProvider(workspaceId: string): GITConnectionType;

  ensureResolved(workspaceId: string): Promise<void>;
  applyLicenseToResolvedOrgs(): Promise<void>;
}
