import * as jwt from 'jsonwebtoken';

jest.mock('express-http-proxy', () => () => jest.fn());
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';

describe('the token sent to PostgREST', () => {
  const sign = () => {
    const service: any = Object.create(PostgrestProxyService.prototype);
    service.configService = { get: () => 'test-secret-that-is-long-enough-for-hs256' };
    return jwt.decode(service.signJwtPayload('tooljet_user')) as Record<string, unknown>;
  };

  it('has no iat, which PostgREST can reject as issued in the future, and still expires', () => {
    const claims = sign();
    expect(claims.iat).toBeUndefined();
    expect(claims.role).toBe('tooljet_user');
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
    expect(claims.exp).toBeLessThanOrEqual(Date.now() / 1000 + 61);
  });
});
