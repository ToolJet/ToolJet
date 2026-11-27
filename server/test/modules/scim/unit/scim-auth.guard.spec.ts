import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScimAuthGuard } from '@modules/scim/guards/scim-auth.guard';

/** @group platform */
describe('ScimAuthGuard', () => {
  const makeContext = (authHeader?: string): ExecutionContext => {
    const request = { headers: authHeader ? { authorization: authHeader } : {} };
    return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  };
  const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  const configWith = (env: Record<string, string>) => ({ get: (key: string) => env[key] }) as unknown as ConfigService;
  const guardWith = (env: Record<string, string>) => new ScimAuthGuard(configWith({ SCIM_ENABLED: 'true', ...env }));

  it('rejects when SCIM is not enabled', () => {
    const guard = new ScimAuthGuard(configWith({}));
    expect(() => guard.canActivate(makeContext(basic('u', 'p')))).toThrow(UnauthorizedException);
  });

  it('rejects a request without an Authorization header', () => {
    const guard = guardWith({ SCIM_HEADER_AUTH_TOKEN: 'tok' });
    expect(() => guard.canActivate(makeContext())).toThrow(UnauthorizedException);
  });

  describe('when only Basic credentials are configured', () => {
    const guard = guardWith({ SCIM_BASIC_AUTH_USER: 'scim-user', SCIM_BASIC_AUTH_PASS: 'pa:ss' });

    it('accepts the configured user and password, including a colon in the password', () => {
      expect(guard.canActivate(makeContext(basic('scim-user', 'pa:ss')))).toBe(true);
    });

    it('rejects a wrong password', () => {
      expect(() => guard.canActivate(makeContext(basic('scim-user', 'wrong')))).toThrow(UnauthorizedException);
    });

    it('rejects a token-style header because no header token is configured', () => {
      expect(() => guard.canActivate(makeContext('anything'))).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(makeContext('Bearer'))).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(makeContext('Bearer x'))).toThrow(UnauthorizedException);
    });
  });

  describe('when only a header token is configured', () => {
    const guard = guardWith({ SCIM_HEADER_AUTH_TOKEN: 'the-token' });

    it('accepts the token with or without the Bearer prefix', () => {
      expect(guard.canActivate(makeContext('Bearer the-token'))).toBe(true);
      expect(guard.canActivate(makeContext('the-token'))).toBe(true);
    });

    it('accepts the token after a scheme name in any case', () => {
      expect(guard.canActivate(makeContext('bearer the-token'))).toBe(true);
    });

    it('rejects a wrong token', () => {
      expect(() => guard.canActivate(makeContext('Bearer wrong'))).toThrow(UnauthorizedException);
    });

    it('rejects Basic credentials because none are configured', () => {
      expect(() => guard.canActivate(makeContext('Basic Og=='))).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(makeContext(basic('', '')))).toThrow(UnauthorizedException);
    });
  });

  describe('when a credential still has the old sample value', () => {
    it('rejects the sample Basic credentials', () => {
      const guard = guardWith({ SCIM_BASIC_AUTH_USER: '12345', SCIM_BASIC_AUTH_PASS: '12345' });
      expect(() => guard.canActivate(makeContext(basic('12345', '12345')))).toThrow(UnauthorizedException);
    });

    it('still accepts a real password for a user named like the sample', () => {
      const guard = guardWith({ SCIM_BASIC_AUTH_USER: '12345', SCIM_BASIC_AUTH_PASS: 'a-real-password' });
      expect(guard.canActivate(makeContext(basic('12345', 'a-real-password')))).toBe(true);
    });

    it('rejects the sample header token', () => {
      const guard = guardWith({ SCIM_HEADER_AUTH_TOKEN: 'my-secure-header-token' });
      expect(() => guard.canActivate(makeContext('Bearer my-secure-header-token'))).toThrow(UnauthorizedException);
    });
  });
});
