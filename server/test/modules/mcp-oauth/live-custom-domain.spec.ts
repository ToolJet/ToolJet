import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { resolveLiveCustomDomainHost } from '@modules/custom-domains/live-origin';

describe('live custom-domain SSO callback authority', () => {
  const canonical = 'https://tooljet.synthetic.example/tools';
  const organizationId = 'garden-workspace';

  test('accepts only a live domain owned by the login workspace', async () => {
    const resolveCustomDomain = jest.fn(async () => ({ organizationId }));
    await expect(
      resolveLiveCustomDomainHost(canonical, 'garden.synthetic.example', organizationId, {
        resolveCustomDomain,
      })
    ).resolves.toBe('https://garden.synthetic.example');
    expect(resolveCustomDomain).toHaveBeenCalledWith('garden.synthetic.example', { requireActiveSsl: true });
    await expect(
      resolveLiveCustomDomainHost(canonical, 'garden.synthetic.example', 'another-workspace', {
        resolveCustomDomain,
      })
    ).resolves.toBeNull();
  });

  test.each([new NotFoundException(), new ForbiddenException()])(
    'falls back after removal or loss of feature eligibility instead of trusting stale routing data',
    async (failure) => {
      const resolveCustomDomain = jest.fn(async () => {
        throw failure;
      });
      await expect(
        resolveLiveCustomDomainHost(canonical, 'garden.synthetic.example', organizationId, {
          resolveCustomDomain,
        })
      ).resolves.toBeNull();
    }
  );

  test('never asks the resolver to authorize the canonical or malformed host', async () => {
    const resolveCustomDomain = jest.fn();
    for (const host of ['tooljet.synthetic.example', 'garden.synthetic.example:443', 'garden/other']) {
      await expect(
        resolveLiveCustomDomainHost(canonical, host, organizationId, { resolveCustomDomain })
      ).resolves.toBeNull();
    }
    expect(resolveCustomDomain).not.toHaveBeenCalled();
  });
});
