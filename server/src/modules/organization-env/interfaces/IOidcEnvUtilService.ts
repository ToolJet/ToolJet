import { EnvProviderState, OidcEnvConfig } from '@modules/organization-env/types';

export interface IOidcEnvUtilService {
  initialize(): Promise<void>;

  // Workspace-scoped — a workspace may have multiple OIDC providers, each claiming its own
  // WORKSPACE_OIDC_CONFIG array slot by position (envConfigIndex), persisted in that
  // provider's own sso_configs.configs.envConfigIndex — see toggleOidcEnvConfig.
  hasOidcConfig(organizationId: string, envConfigIndex: number): boolean;
  getOidcConfig(organizationId: string, configId: string, envConfigIndex: number): Promise<OidcEnvConfig | null>;
  getOidcTemplateConfig(organizationId: string, envConfigIndex: number): Promise<Partial<OidcEnvConfig> | null>;
  getWorkspaceProviderCount(organizationId: string): Promise<number>;
  getResolvedWorkspaceOrganizationIds(): string[];
  // Keyed by configId (specific sso_configs row), not organizationId — a workspace can have
  // several env-managed OIDC providers at once.
  setProviderState(configId: string, state: EnvProviderState): void;
  getProviderState(configId: string): EnvProviderState;
  ensureResolved(organizationId: string): Promise<void>;

  // Instance-scoped (single config, no workspace context)
  hasInstanceOidcConfig(): boolean;
  getInstanceOidcConfig(): Promise<OidcEnvConfig | null>;
  getInstanceOidcTemplateConfig(): Promise<Partial<OidcEnvConfig> | null>;
  getInstanceProviderState(): EnvProviderState;
  // One instance-level provider can serve multiple workspaces, each with its own claim/mapping
  // via OIDC_{PROVIDERNAME}_GROUP_SYNC_{WORKSPACE_NAME}_CLAIM_NAME/_MAPPING.
  getInstanceGroupSyncMappings(): Promise<Array<{ organizationId: string; claimName?: string; groupMapping?: Record<string, string> }>>;
  // Admin-display-only: literal env var key names instead of resolved values (see impl).
  getInstanceGroupSyncTemplateConfig(): Promise<Array<{ organizationId: string; claimName?: string; groupMapping?: string }>>;

  applyLicenseToResolvedOrgs(): Promise<void>;
}
