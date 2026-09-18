import { deriveOidcTemplate } from '@modules/organization-env/parsers/parse-env-config';
import { OIDC_ENV_KEYS } from '@modules/organization-env/constants';
import { toEnvKeyName } from '@modules/organization-env/types/env-parse-result';

function makeStore(values: Record<string, string>) {
  const map = new Map(Object.entries(values));
  return {
    has: (key: string) => map.has(key),
    get: (key: string) => map.get(key),
    toTemplate: (key: string) => toEnvKeyName(`{{${key}}}`),
  };
}

describe('deriveOidcTemplate() — grant type exposed to the frontend', () => {
  it('exposes the real "authorization_code" value, not a masked placeholder', () => {
    const store = makeStore({ [OIDC_ENV_KEYS.GRANT_TYPE]: 'authorization_code' });

    const template = deriveOidcTemplate(store.has, store.get, store.toTemplate);

    expect(template?.grantType).toBe('authorization_code');
  });

  it('normalizes the env enum "pkce" to the frontend/GUI enum "authorization_code_pkce"', () => {
    const store = makeStore({ [OIDC_ENV_KEYS.GRANT_TYPE]: 'pkce' });

    const template = deriveOidcTemplate(store.has, store.get, store.toTemplate);

    expect(template?.grantType).toBe('authorization_code_pkce');
  });
});

describe('deriveOidcTemplate() — provider name: masked field vs. real display name', () => {
  it('masks name to the env-var placeholder, and exposes the real value separately as resolvedName', () => {
    const store = makeStore({ [OIDC_ENV_KEYS.NAME]: 'OKTA_WS' });

    const template = deriveOidcTemplate(store.has, store.get, store.toTemplate);

    expect(template?.name).toBe(`{{${OIDC_ENV_KEYS.NAME}}}`);
    expect(template?.resolvedName).toBe('OKTA_WS');
  });
});
