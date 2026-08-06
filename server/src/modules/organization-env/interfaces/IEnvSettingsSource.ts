import { EnvProviderState } from '@modules/organization-env/types';

/**
 * The admin-side contract every env-config provider shares — SAML and LDAP are literal
 * instances of one implementation (EnvSettingsSourceService<T>); OIDC's shape (multi-provider,
 * instance scope) means it can't share that one class, but its public surface still answers
 * the same four questions. Kept separate from the provider-specific interfaces
 * (ISamlEnvUtilService, etc.) — those keep their existing method names for backward
 * compatibility with current call sites; this one is the structural contract underneath.
 */
export interface IEnvSettingsSource<T> {
  initialize(): Promise<void>;
  ensureResolved(organizationId: string): Promise<void>;
  getResolvedOrganizationIds(): string[];

  /** Is there a complete (all required keys present) env config for this org? */
  hasConfig(organizationId: string): boolean;
  /** resolve(): real, typed values — for the login/consumer path, never the UI. */
  getConfig(organizationId: string): Promise<T | null>;
  /** describe(): masked env key names only — for the admin settings display. */
  getTemplateConfig(organizationId: string): Promise<Partial<T> | null>;

  setProviderState(organizationId: string, state: EnvProviderState): void;
  getProviderState(organizationId: string): EnvProviderState;

  /** Re-evaluate every resolved org on a license change — enable on upgrade, revoke on loss. */
  applyLicenseToResolvedOrgs(): Promise<void>;
}
