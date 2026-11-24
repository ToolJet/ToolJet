jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
import { ConfigService } from '@nestjs/config';
import { McpOAuthThrottleGuard, OAuthRateWindows, oauthAddressBucket } from '@modules/mcp-oauth/throttle.guard';

const context = (route: string, address: string, forwarded?: string, body = {}) =>
  ({
    getHandler: () => ({ name: route }),
    switchToHttp: () => ({
      getRequest: () => ({
        socket: { remoteAddress: address },
        headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
        body,
      }),
      getResponse: () => ({ setHeader: jest.fn() }),
    }),
  }) as any;
const service = () => ({ assertEnabled: jest.fn(), rateLimitGrant: jest.fn(async () => undefined) });

test('explicit trusted proxies separate anonymous callers, ignoring spoofed leftmost hops', async () => {
  const guard = new McpOAuthThrottleGuard(
    service() as any,
    new ConfigService({ MCP_OAUTH_TRUSTED_PROXIES: '10.0.0.0/8' })
  );
  for (let i = 0; i < 10; i++) await guard.canActivate(context('register', '10.1.2.3', `192.0.2.${i}, 198.51.100.1`));
  await expect(guard.canActivate(context('register', '10.1.2.3', '203.0.113.99, 198.51.100.1'))).rejects.toMatchObject({
    status: 429,
  });
  await expect(guard.canActivate(context('register', '10.1.2.3', '198.51.100.2'))).resolves.toBe(true);
});
test('untrusted direct callers cannot select a bucket with forwarded headers', async () => {
  const guard = new McpOAuthThrottleGuard(service() as any, new ConfigService({}));
  for (let i = 0; i < 10; i++) await guard.canActivate(context('register', '198.51.100.1', `203.0.113.${i}`));
  await expect(guard.canActivate(context('register', '198.51.100.1', '203.0.113.99'))).rejects.toMatchObject({
    status: 429,
  });
});
test.each(['token', 'viewer'])(
  '%s authenticated grants survive anonymous saturation and do not share each other’s quota',
  async (route) => {
    const oauth = service();
    const guard = new McpOAuthThrottleGuard(oauth as any, new ConfigService({}));
    const ctx = context(route, '198.51.100.1');
    for (let i = 0; i < 120; i++) await guard.canActivate(ctx);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ status: 429 });
    oauth.rateLimitGrant.mockResolvedValue('synthetic-grant-a' as any);
    for (let i = 0; i < 120; i++) await guard.canActivate(ctx);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ status: 429 });
    oauth.rateLimitGrant.mockResolvedValue('synthetic-grant-b' as any);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  }
);
test('bounded anonymous storage cannot consume authenticated storage; windows expire', () => {
  const windows = new OAuthRateWindows();
  for (let i = 0; i < 10000; i++) expect(windows.take(String(i), 1, false, 0)).toBe(true);
  expect(windows.take('overflow', 1, false, 0)).toBe(true);
  expect(windows.take('verified-grant', 1, true, 0)).toBe(true);
  expect(windows.take('9999', 1, false, 0)).toBe(false);
  expect(windows.take('overflow', 1, false, 60000)).toBe(true);
});

test('IPv6 privacy addresses share a /64 while separate networks and IPv4 remain distinct', () => {
  expect(oauthAddressBucket('2001:db8:1:2::1')).toBe(oauthAddressBucket('2001:db8:1:2:ffff:ffff:ffff:ffff'));
  expect(oauthAddressBucket('2001:db8:1:3::1')).not.toBe(oauthAddressBucket('2001:db8:1:2::1'));
  expect(oauthAddressBucket('::ffff:198.51.100.1')).toBe('198.51.100.1');
});
test('authenticated capacity evicts the oldest entry without denying a new verified grant', () => {
  const windows = new OAuthRateWindows();
  for (let i = 0; i < 10000; i++) windows.take(String(i), 120, true, 0);
  expect(windows.take('new-grant', 120, true, 0)).toBe(true);
});
