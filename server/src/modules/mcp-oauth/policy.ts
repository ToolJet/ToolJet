import { DataSource } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import type { ILoginConfigsUtilService } from '@modules/login-configs/interfaces/IUtilsService';
import { hash, canonicalJson } from './protocol';

export async function loadLoginPolicy(dataSource: DataSource, loginConfigs: Pick<ILoginConfigsUtilService, 'fetchOrganizationDetails'>, organizationId: string) {
  const configs: any = await loginConfigs.fetchOrganizationDetails(
    organizationId,
    [true, false],
    true,
    true,
  );
  if (!configs) throw new UnauthorizedException('Workspace login is unavailable');
  const providers = ['form', 'google', 'git', 'openid', 'saml', 'ldap'].flatMap((type) => {
    const list = Array.isArray(configs[type]) ? configs[type] : configs[type] ? [configs[type]] : [];
    return list.map((provider) => ({
      type,
      id: provider.configId || provider.config_id,
      enabled:
        !!provider.enabled && provider.featureIncluded !== false && provider.feature_included !== false,
      config: Object.fromEntries(Object.entries(provider.configs || {}).filter(([key]) => key !== 'name')),
    }));
  });
  // Include workspace and instance restrictions that are not in the public provider list.
  const [workspacePolicy] = await dataSource.query(
    'SELECT slug, domain, password_allowed_domains, password_restricted_domains, inherit_sso FROM organizations WHERE id = $1',
    [organizationId],
  );
  const instancePolicy = await dataSource.query(
    "SELECT key,value FROM instance_settings WHERE key IN ('ALLOWED_DOMAINS','PASSWORD_ALLOWED_DOMAINS','PASSWORD_RESTRICTED_DOMAINS','ENABLE_WORKSPACE_LOGIN_CONFIGURATION','MFA_ENABLED') ORDER BY key",
  );
  // Hash stored encrypted configuration, never store or expose it in OAuth credentials.
  // Public login metadata intentionally hides secrets and group mappings.
  const storedProviders = await dataSource.query(
    `SELECT id, sso, enabled, config_scope,
       CASE WHEN jsonb_typeof(configs::jsonb) = 'object' THEN configs::jsonb - 'name' ELSE configs::jsonb END AS configs
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
    fingerprint: hash(canonicalJson({
      providers: providers.sort((a, b) => `${a.type}:${a.id || ''}`.localeCompare(`${b.type}:${b.id || ''}`)),
      version: 1,
      workspacePolicy,
      instancePolicy,
      storedProviders,
      groupSync,
    })),
    password: providers.some((p) => p.type === 'form' && p.enabled),
    sso: providers.some((p) => p.type !== 'form' && p.enabled),
  };
}
