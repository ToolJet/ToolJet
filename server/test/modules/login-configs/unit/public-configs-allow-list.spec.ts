/** @group platform */
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';

// The login page reads these fields and nothing else (one allow list per SSO type).
// google: client_id · git: client_id, host_name · openid, saml, ldap: name

describe('public login settings: SSO configs', () => {
  let service: LoginConfigsUtilService;

  beforeEach(() => {
    service = new LoginConfigsUtilService({ get: jest.fn() } as any, {} as any, {} as any, {} as any);
  });

  const publicConfigsOf = (sso: string, configs: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
    service.buildConfigs({ sso, enabled: true, configs, ...extra }, 'cfg-1');

  describe('keeps what the login page shows', () => {
    it.each([
      ['google', { clientId: 'g-id' }, { clientId: 'g-id' }],
      [
        'git',
        { clientId: 'gh-id', hostName: 'github.example.com' },
        { clientId: 'gh-id', hostName: 'github.example.com' },
      ],
      ['openid', { name: 'Corp OIDC' }, { name: 'Corp OIDC' }],
      ['saml', { name: 'Corp SAML' }, { name: 'Corp SAML' }],
      ['ldap', { name: 'Corp LDAP' }, { name: 'Corp LDAP' }],
    ])('%s', (sso, configs, expected) => {
      expect(publicConfigsOf(sso, { ...configs, internalNote: 'synthetic' }).configs).toEqual(expected);
    });

    it('keeps enabled, the config id and the plan banner, so every button still renders', () => {
      const result = service.buildConfigs(
        {
          sso: 'openid',
          enabled: true,
          featureIncluded: true,
          bannerMessage: 'Upgrade',
          configs: { name: 'Corp OIDC' },
        },
        'cfg-1'
      );
      expect(result).toMatchObject({
        enabled: true,
        configId: 'cfg-1',
        featureIncluded: true,
        bannerMessage: 'Upgrade',
        configs: { name: 'Corp OIDC' },
      });
    });

    it('accepts both camelCase and snake_case field names', () => {
      expect(publicConfigsOf('git', { client_id: 'gh-id', host_name: 'h' }).configs).toEqual({
        client_id: 'gh-id',
        host_name: 'h',
      });
    });
  });

  describe('hides everything else', () => {
    it('the LDAP certificates and private key', () => {
      const result = publicConfigsOf('ldap', {
        name: 'Corp LDAP',
        host: 'ldap.example.com',
        sslCerts: { client_key: 'synthetic-private-key', client_cert: 'c', server_cert: 's' },
      });
      expect(JSON.stringify(result)).not.toContain('synthetic-private-key');
      expect(result.configs).not.toHaveProperty('sslCerts');
      expect(result.configs).not.toHaveProperty('host');
    });

    it('a field it does not know, even when the name has no "secret" in it', () => {
      const result = publicConfigsOf('openid', {
        name: 'Corp OIDC',
        codeVerifier: 'synthetic-verifier',
        apiToken: 'synthetic-token',
      });
      expect(JSON.stringify(result)).not.toContain('synthetic-verifier');
      expect(JSON.stringify(result)).not.toContain('synthetic-token');
    });

    it('client secrets', () => {
      const result = publicConfigsOf('git', { clientId: 'id', clientSecret: 'synthetic-secret' });
      expect(JSON.stringify(result)).not.toContain('synthetic-secret');
    });

    it('group sync rows', () => {
      const result = publicConfigsOf(
        'openid',
        { name: 'Corp OIDC' },
        { oidcGroupSyncs: [{ organizationId: 'org-b', groupMapping: { 'b-team': 'admin' } }] }
      );
      expect(JSON.stringify(result)).not.toContain('org-b');
      expect(result).not.toHaveProperty('oidcGroupSyncs');
    });

    it('all configs of an SSO type it does not know', () => {
      expect(publicConfigsOf('future-sso', { name: 'x', secretish: 'y' }).configs).toEqual({});
    });
  });
});
