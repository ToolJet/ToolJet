import 'reflect-metadata';
jest.mock('@modules/custom-domains/repository', () => ({ CustomDomainRepository: class {} }));
jest.mock('@modules/custom-domains/cache.service', () => ({ CustomDomainCacheService: class {} }));
jest.mock('@ee/custom-domains/providers/cloudflare-provider', () => ({ CloudflareProvider: class {} }));
import { CustomDomainsService } from '@ee/custom-domains/service';
import { resolveLiveCustomDomainHost } from '@modules/custom-domains/live-origin';

describe('SSO callback TLS readiness', () => {
  test.each(['pending_validation', 'pending_issuance', 'expired', null])('rejects active domains with SSL status %s', async (sslStatus) => {
    const service = new CustomDomainsService(
      { findActiveDomain: async () => ({ organizationId: 'orchard', sslStatus }) } as any,
      {} as any, {} as any, { getLicenseTerms: async () => true } as any,
    );
    await expect(resolveLiveCustomDomainHost('https://canonical.synthetic.example', 'orchard.synthetic.example', 'orchard', service))
      .resolves.toBeNull();
  });
  test('accepts an active TLS-ready domain using the real resolver and preserves ordinary resolution', async () => {
    const domain = { organizationId: 'orchard', sslStatus: 'active' };
    const service = new CustomDomainsService(
      { findActiveDomain: async () => domain } as any,
      {} as any, {} as any, { getLicenseTerms: async () => true } as any,
    );
    await expect(resolveLiveCustomDomainHost('https://canonical.synthetic.example', 'orchard.synthetic.example', 'orchard', service))
      .resolves.toBe('https://orchard.synthetic.example');
    domain.sslStatus = 'pending_issuance';
    await expect(service.resolveCustomDomain('orchard.synthetic.example')).resolves.toMatchObject({ organizationId: 'orchard' });
  });
});
