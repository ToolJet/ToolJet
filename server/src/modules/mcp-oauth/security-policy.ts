import { canonicalJson } from './protocol';

// Only fields consumed by authentication belong in the security policy. Keep this
// projection shared by write-time revocation and the live grant fingerprint.
const SSO_SECURITY_FIELDS: Record<string, string[]> = {
  form: [],
  google: ['client_id', 'client_secret'],
  git: ['client_id', 'client_secret', 'host_name'],
  openid: [
    'client_id',
    'client_secret',
    'well_known_url',
    'custom_scopes',
    'grant_type',
    'enable_group_sync',
    'claim_name',
    'group_mapping',
    'enable_short_session',
  ],
  saml: ['idp_metadata', 'group_attribute', 'group_sync_enabled'],
  ldap: [
    'host',
    'port',
    'ssl',
    'ssl_certs',
    'ssl_options',
    'basedn',
    'basedns',
    'bind_attribute',
    'use_upn_as_email',
    'enable_group_sync',
  ],
};

export const INSTANCE_LOGIN_SECURITY_KEYS = [
  'ALLOWED_DOMAINS',
  'PASSWORD_ALLOWED_DOMAINS',
  'PASSWORD_RESTRICTED_DOMAINS',
  'ENABLE_WORKSPACE_LOGIN_CONFIGURATION',
  'MFA_ENABLED',
];

export function ssoSecurityConfig(type: string, config: Record<string, any> = {}) {
  const normalized = Object.fromEntries(
    Object.entries(config || {}).map(([key, value]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      value,
    ])
  );
  if (type === 'openid') normalized.grant_type ||= 'authorization_code';
  return Object.fromEntries((SSO_SECURITY_FIELDS[type] || []).map((key) => [key, normalized[key] ?? null]));
}

export function sameSecurityValue(before: unknown, after: unknown): boolean {
  return canonicalJson(before) === canonicalJson(after);
}
