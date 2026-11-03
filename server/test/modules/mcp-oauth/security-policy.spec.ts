import { sameSecurityValue, ssoSecurityConfig } from '@modules/mcp-oauth/security-policy';

test('OIDC metadata and the authorization-code default do not change the security policy', () => {
  const before = { client_id: 'synthetic-orchard-client', client_secret: 'synthetic-ciphertext' };
  expect(ssoSecurityConfig('openid', { ...before, name: 'Orchard', presentation_version: 2,
    grant_type: 'authorization_code' })).toEqual(ssoSecurityConfig('openid', before));
  expect(ssoSecurityConfig('openid', { clientId: before.client_id, clientSecret: before.client_secret }))
    .toEqual(ssoSecurityConfig('openid', before));
});

test.each([
  ['google', 'client_id'], ['google', 'client_secret'], ['git', 'host_name'],
  ['openid', 'client_id'], ['openid', 'client_secret'], ['openid', 'well_known_url'],
  ['openid', 'custom_scopes'], ['openid', 'grant_type'], ['openid', 'enable_group_sync'],
  ['openid', 'enable_short_session'], ['openid', 'claim_name'], ['openid', 'group_mapping'],
  ['saml', 'idp_metadata'], ['saml', 'group_attribute'], ['saml', 'group_sync_enabled'],
  ['ldap', 'host'], ['ldap', 'port'], ['ldap', 'ssl'], ['ldap', 'ssl_certs'],
  ['ldap', 'basedn'], ['ldap', 'basedns'], ['ldap', 'bind_attribute'], ['ldap', 'use_upn_as_email'],
  ['ldap', 'enable_group_sync'],
])('%s authentication field %s remains security-relevant', (provider, field) => {
  expect(sameSecurityValue(ssoSecurityConfig(provider, {}),
    ssoSecurityConfig(provider, { [field]: 'synthetic-changed-value' }))).toBe(false);
});
