import { ssoSecurityConfig, INSTANCE_LOGIN_SECURITY_KEYS } from './security-policy';
import { DataSource, EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import type { ILoginConfigsUtilService } from '@modules/login-configs/interfaces/IUtilsService';
import { hash, canonicalJson } from './protocol';
import { isValidPasswordDomain, isValidSSODomain } from '@helpers/login-domain';

export async function loadLoginPolicy(dataSource: DataSource, loginConfigs: Pick<ILoginConfigsUtilService, 'fetchOrganizationDetails'>, organizationId: string) {
  const configs: any = await loginConfigs.fetchOrganizationDetails(
    organizationId,
    [true, false],
    true,
    true,
  );
  // The platform login lookup accepts both slugs and IDs, preferring a slug.
  // OAuth has already bound an immutable ID: never accept another workspace's
  // policy if a slug happens to equal that ID.
  if (!configs || configs.id !== organizationId) throw new UnauthorizedException('Workspace login is unavailable');
  const providers = ['form', 'google', 'git', 'openid', 'saml', 'ldap'].flatMap((type) => {
    const list = Array.isArray(configs[type]) ? configs[type] : configs[type] ? [configs[type]] : [];
    return list.map((provider) => ({
      type,
      id: provider.configId || provider.config_id,
      enabled:
        !!provider.enabled && provider.featureIncluded !== false && provider.feature_included !== false,
      config: ssoSecurityConfig(type, provider.configs),
    }));
  });
  // Include workspace and instance restrictions that are not in the public provider list.
  const [workspacePolicy] = await dataSource.query(
    'SELECT slug, domain, password_allowed_domains, password_restricted_domains, inherit_sso FROM organizations WHERE id = $1',
    [organizationId],
  );
  const instancePolicy = await dataSource.query(
    'SELECT key,value FROM instance_settings WHERE key = ANY($1) ORDER BY key', [INSTANCE_LOGIN_SECURITY_KEYS],
  );
  // Hash stored encrypted configuration, never store or expose it in OAuth credentials.
  // Public login metadata intentionally hides secrets and group mappings.
  const storedProviders = await dataSource.query(
    `SELECT id, sso, enabled, config_scope,
       configs
     FROM sso_configs
     WHERE organization_id = $1 OR config_scope = 'instance' ORDER BY id`,
    [organizationId],
  );
  const groupSync = await dataSource.query(
    `SELECT sso_config_id, organization_id, claim_name, group_mapping, enable_group_sync
     FROM sso_config_oidc_group_sync WHERE organization_id = $1 OR organization_id IS NULL ORDER BY id`,
    [organizationId],
  );
  return {
    providers,
    requiresWorkspaceAuthentication: (method: string, providerId: string | null) => method === 'openid' &&
      groupSync.some((sync) => sync.enable_group_sync && (providerId
        ? sync.sso_config_id === providerId
        : storedProviders.some((provider) => provider.id === sync.sso_config_id &&
          provider.sso === method && provider.config_scope === 'instance' && provider.enabled))),
    allowsEmail: (email: string, method: string) => {
      const instance = Object.fromEntries(instancePolicy.map((row) => [row.key, row.value]));
      return method === 'form'
        ? isValidPasswordDomain(
            email,
            workspacePolicy?.password_allowed_domains,
            workspacePolicy?.password_restricted_domains,
            instance.PASSWORD_ALLOWED_DOMAINS,
            instance.PASSWORD_RESTRICTED_DOMAINS
          )
        : isValidSSODomain(email, workspacePolicy?.domain, instance.ALLOWED_DOMAINS);
    },
    fingerprint: hash(canonicalJson({
      providers: providers.sort((a, b) => `${a.type}:${a.id || ''}`.localeCompare(`${b.type}:${b.id || ''}`)),
      version: 1,
      workspacePolicy,
      instancePolicy,
      storedProviders: storedProviders.map(provider => ({ ...provider, configs: ssoSecurityConfig(provider.sso, provider.configs) })),
      groupSync,
    })),
    password: providers.some((p) => p.type === 'form' && p.enabled),
    sso: providers.some((p) => p.type !== 'form' && p.enabled),
  };
}

/** Serialize approval with security changes before inserting a grant. */
export async function lockMcpOAuthConsent(manager: EntityManager) {
  await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-security-policy'))");
}
