import { SAML_ENV_KEYS, LDAP_ENV_KEYS, OIDC_ENV_KEYS, REQUIRED_KEYS, REQUIRED_OIDC_KEYS } from '@modules/organization-env/constants';
import { SamlEnvConfig, LdapEnvConfig, OidcEnvConfig } from '@modules/organization-env/types';
import { EnvParseResult, EnvIssue, issue, EnvKeyName, toEnvKeyName } from '@modules/organization-env/types/env-parse-result';

export const VALID_OIDC_GRANT_TYPES = ['authorization_code', 'pkce'] as const;

export function isValidGrantType(value: string): value is (typeof VALID_OIDC_GRANT_TYPES)[number] {
  return (VALID_OIDC_GRANT_TYPES as readonly string[]).includes(value);
}

export function inferGroupSyncDefault(toggleRaw: string | undefined, siblingFieldsConfigured: boolean): boolean {
  return toggleRaw ? toggleRaw === 'true' : siblingFieldsConfigured;
}

export function parseGroupMappingValue(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {}
  return undefined;
}

export function parseSamlEnvConfig(values: Record<string, string | undefined>): EnvParseResult<SamlEnvConfig> {
  const k = SAML_ENV_KEYS;
  const idpMetadata = values[k.IDP_METADATA];
  const name = values[k.NAME];
  if (!idpMetadata || !name) {
    const issues: EnvIssue[] = [
      !idpMetadata && issue(k.IDP_METADATA, 'missing', `${k.IDP_METADATA} is required`),
      !name && issue(k.NAME, 'missing', `${k.NAME} is required`),
    ].filter(Boolean) as EnvIssue[];
    return { ok: false, issues };
  }

  const groupAttribute = values[k.GROUP_ATTRIBUTE];
  const groupSyncEnabledRaw = values[k.GROUP_SYNC_ENABLED];

  const config: SamlEnvConfig = {
    idpMetadata,
    name,
    ...(groupAttribute && { groupAttribute }),
    groupSyncEnabled: inferGroupSyncDefault(groupSyncEnabledRaw, Boolean(groupAttribute)),
  };
  return { ok: true, config };
}

export function deriveSamlTemplate(
  has: (key: string) => boolean,
  toTemplate: (key: string) => EnvKeyName = toEnvKeyName
): Partial<Omit<SamlEnvConfig, 'groupSyncEnabled'>> | null {
  const k = SAML_ENV_KEYS;
  const config: Partial<Omit<SamlEnvConfig, 'groupSyncEnabled'>> = {};
  if (has(k.IDP_METADATA)) config.idpMetadata = toTemplate(k.IDP_METADATA);
  if (has(k.NAME)) config.name = toTemplate(k.NAME);
  if (has(k.GROUP_ATTRIBUTE)) config.groupAttribute = toTemplate(k.GROUP_ATTRIBUTE);
  return Object.keys(config).length ? config : null;
}

export function parseLdapEnvConfig(values: Record<string, string | undefined>): EnvParseResult<LdapEnvConfig> {
  const k = LDAP_ENV_KEYS;
  const host = values[k.HOST_NAME];
  const port = values[k.PORT];
  const basedn = values[k.BASE_DN];
  const name = values[k.NAME];
  if (!host || !port || !basedn || !name) {
    const issues: EnvIssue[] = [
      !host && issue(k.HOST_NAME, 'missing', `${k.HOST_NAME} is required`),
      !port && issue(k.PORT, 'missing', `${k.PORT} is required`),
      !basedn && issue(k.BASE_DN, 'missing', `${k.BASE_DN} is required`),
      !name && issue(k.NAME, 'missing', `${k.NAME} is required`),
    ].filter(Boolean) as EnvIssue[];
    return { ok: false, issues };
  }

  const ssl = values[k.SSL];
  const enableGroupSync = values[k.ENABLE_GROUP_SYNC];

  let sslCerts: LdapEnvConfig['sslCerts'];
  if (values[k.SSL_CERTIFICATE] === 'Certificates') {
    sslCerts = {
      client_key: values[k.CLIENT_KEY] ?? '',
      client_cert: values[k.CLIENT_CERTIFICATE] ?? '',
      server_cert: values[k.SERVER_CERTIFICATE] ?? '',
    };
  }

  const config: LdapEnvConfig = {
    host,
    port,
    basedn,
    name,
    ...(ssl && { ssl: ssl === 'true' }),
    ...(sslCerts && { sslCerts }),
    ...(enableGroupSync && { enableGroupSync: enableGroupSync === 'true' }),
  };
  return { ok: true, config };
}

export function deriveLdapTemplate(
  values: Record<string, string | undefined>,
  has: (key: string) => boolean,
  toTemplate: (key: string) => EnvKeyName = toEnvKeyName
): Partial<LdapEnvConfig> | null {
  const k = LDAP_ENV_KEYS;
  const config: Partial<LdapEnvConfig> = {};
  if (has(k.HOST_NAME)) config.host = toTemplate(k.HOST_NAME);
  if (has(k.PORT)) config.port = toTemplate(k.PORT);
  if (has(k.BASE_DN)) config.basedn = toTemplate(k.BASE_DN);
  if (has(k.NAME)) config.name = toTemplate(k.NAME);
  if (has(k.SSL)) config.ssl = values[k.SSL] === 'true';
  if (has(k.ENABLE_GROUP_SYNC)) config.enableGroupSync = values[k.ENABLE_GROUP_SYNC] === 'true';

  if (values[k.SSL_CERTIFICATE] === 'Certificates') {
    config.sslCerts = {
      client_key: has(k.CLIENT_KEY) ? toTemplate(k.CLIENT_KEY) : '',
      client_cert: has(k.CLIENT_CERTIFICATE) ? toTemplate(k.CLIENT_CERTIFICATE) : '',
      server_cert: has(k.SERVER_CERTIFICATE) ? toTemplate(k.SERVER_CERTIFICATE) : '',
    };
  }

  return Object.keys(config).length ? config : null;
}

export function parseOidcEnvConfig(values: Record<string, string | undefined>): EnvParseResult<OidcEnvConfig> {
  const k = OIDC_ENV_KEYS;
  const clientId = values[k.CLIENT_ID];
  const wellKnownUrl = values[k.WELL_KNOWN_URL];
  const name = values[k.NAME];
  const grantType = values[k.GRANT_TYPE];
  if (!clientId || !wellKnownUrl || !name || !grantType) {
    const issues: EnvIssue[] = [
      !clientId && issue(k.CLIENT_ID, 'missing', `${k.CLIENT_ID} is required`),
      !wellKnownUrl && issue(k.WELL_KNOWN_URL, 'missing', `${k.WELL_KNOWN_URL} is required`),
      !name && issue(k.NAME, 'missing', `${k.NAME} is required`),
      !grantType && issue(k.GRANT_TYPE, 'missing', `${k.GRANT_TYPE} is required`),
    ].filter(Boolean) as EnvIssue[];
    return { ok: false, issues };
  }

  if (!isValidGrantType(grantType)) {
    return {
      ok: false,
      issues: [issue(k.GRANT_TYPE, 'invalid', `must be one of ${VALID_OIDC_GRANT_TYPES.join(' | ')}, got "${grantType}"`)],
    };
  }

  const clientSecret = values[k.CLIENT_SECRET];
  if (grantType !== 'pkce' && !clientSecret) {
    return { ok: false, issues: [issue(k.CLIENT_SECRET, 'missing', 'required unless grant_type is pkce')] };
  }

  const customScopes = values[k.CUSTOM_SCOPES];
  const claimName = values[k.CLAIM_NAME];
  const enableGroupSyncRaw = values[k.ENABLE_GROUP_SYNC];
  const groupMapping = parseGroupMappingValue(values[k.GROUP_MAPPING]);
  const codeVerifier = values[k.CODE_VERIFIER];

  const config: OidcEnvConfig = {
    clientId,
    wellKnownUrl,
    name,
    grantType,
    ...(clientSecret && { clientSecret }),
    ...(customScopes && { customScopes }),
    ...(claimName && { claimName }),
    enableGroupSync: inferGroupSyncDefault(enableGroupSyncRaw, Boolean(claimName && groupMapping)),
    ...(groupMapping && { groupMapping }),
    ...(codeVerifier && { codeVerifier }),
  };
  return { ok: true, config };
}

export function deriveOidcTemplate(
  has: (key: string) => boolean,
  get: (key: string) => string | undefined,
  toTemplate: (key: string) => EnvKeyName
): Partial<OidcEnvConfig> | null {
  const k = OIDC_ENV_KEYS;
  const config: Partial<OidcEnvConfig> = {};
  if (has(k.CLIENT_ID)) config.clientId = toTemplate(k.CLIENT_ID);
  if (has(k.WELL_KNOWN_URL)) config.wellKnownUrl = toTemplate(k.WELL_KNOWN_URL);
  if (has(k.CLIENT_SECRET)) config.clientSecret = toTemplate(k.CLIENT_SECRET);
  if (has(k.NAME)) config.name = get(k.NAME);
  if (has(k.ENABLE_GROUP_SYNC)) config.enableGroupSync = get(k.ENABLE_GROUP_SYNC) === 'true';
  if (has(k.CUSTOM_SCOPES)) config.customScopes = toTemplate(k.CUSTOM_SCOPES);
  if (has(k.CLAIM_NAME)) config.claimName = toTemplate(k.CLAIM_NAME);
  if (has(k.GROUP_MAPPING)) (config as { groupMapping?: unknown }).groupMapping = toTemplate(k.GROUP_MAPPING);
  if (has(k.GRANT_TYPE)) config.grantType = toTemplate(k.GRANT_TYPE);
  if (has(k.CODE_VERIFIER)) config.codeVerifier = toTemplate(k.CODE_VERIFIER);
  return Object.keys(config).length ? config : null;
}

export function hasAllRequiredOidcKeys(has: (key: string) => boolean): boolean {
  return REQUIRED_OIDC_KEYS.every((key) => has(key));
}

export { REQUIRED_KEYS };
