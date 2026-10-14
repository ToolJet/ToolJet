import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { Issuer } from 'openid-client';

jest.mock('@ee/login-configs/util.service', () => ({ LoginConfigsUtilService: class {} }));
jest.mock('@ee/auth/util.service', () => ({ AuthUtilService: class {} }));
jest.mock('@modules/custom-domains/cache.service', () => ({ CustomDomainCacheService: class {} }));
jest.mock('@helpers/utils.helper', () => ({
  applyCustomDomainCookieOptions: jest.fn(),
  isHttpsEnabled: () => true,
  isAzureEntraIdIssuer: () => false,
}));
import { OidcOAuthService } from '@ee/auth/oauth/util-services/oidc-auth.service';

/** Synthetic concurrent providers exercise workspace isolation without contacting an IdP. */
describe('Workspace SSO evidence prerequisites', () => {
  const codeVerifier = 'synthetic-verifier-'.repeat(4);
  const configs = (id: string) => ({
    configId: id,
    clientId: id,
    wellKnownUrl: `https://${id}.synthetic.example/.well-known/openid-configuration`,
    codeVerifier,
    oidcGroupSyncs: [],
  });
  let service: OidcOAuthService;
  let discovery: jest.SpyInstance;
  beforeEach(() => {
    service = new OidcOAuthService(
      new ConfigService({ TOOLJET_HOST: 'https://tooljet.synthetic.example' }),
      { getConfigs: async (id) => ({ configs: configs(id), organization: { id } }) } as any,
      {} as any,
    );
  });
  afterEach(() => discovery?.mockRestore());

  test('concurrent callbacks retain their own provider client through userinfo validation', async () => {
    let entered: () => void;
    const firstEntered = new Promise<void>((resolve) => (entered = resolve));
    let release: () => void;
    const resume = new Promise<void>((resolve) => (release = resolve));
    class ProviderClient {
      private id: string;
      constructor(config) { this.id = config.client_id; }
      async callback() {
        if (this.id === 'orchard') { entered(); await resume; }
        return { access_token: `synthetic-access-${this.id}` };
      }
      async userinfo(token) {
        if (token !== `synthetic-access-${this.id}`) throw new Error('Cross-provider token');
        return { sub: this.id, email: `${this.id}@synthetic.example`, name: 'Synthetic Operator' };
      }
    }
    discovery = jest.spyOn(Issuer, 'discover').mockResolvedValue({ Client: ProviderClient } as any);
    const first = service.signIn('synthetic-code-orchard', configs('orchard'));
    await firstEntered;
    const second = await service.signIn('synthetic-code-meadow', configs('meadow'));
    release();
    expect((await first).email).toBe('orchard@synthetic.example');
    expect(second.email).toBe('meadow@synthetic.example');
  });

  test('missing browser PKCE verifier fails closed before contacting the provider', async () => {
    discovery = jest.spyOn(Issuer, 'discover');
    await expect(service.signIn('synthetic-code', { ...configs('orchard'), codeVerifier: undefined })).rejects.toThrow('expired');
    expect(discovery).not.toHaveBeenCalled();
  });

  test('every authorization attempt creates a new verifier rather than reusing provider configuration', async () => {
    class ProviderClient {
      issuer = { metadata: { issuer: 'https://orchard.synthetic.example' } };
      authorizationUrl() { return 'https://orchard.synthetic.example/authorize'; }
    }
    discovery = jest.spyOn(Issuer, 'discover').mockResolvedValue({ Client: ProviderClient } as any);
    const first = await service.getConfigs('orchard');
    const second = await service.getConfigs('orchard');
    expect(first.codeVerifier).not.toBe(codeVerifier);
    expect(first.codeVerifier).not.toBe(second.codeVerifier);
    expect(first.codeVerifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/);
  });
});
