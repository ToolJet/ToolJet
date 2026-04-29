import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScimAuthGuard } from '../../../src/modules/scim/guards/scim-auth.guard';

type ScimConfig = Record<string, string | undefined>;

function createExecutionContext(authorization?: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization === undefined ? {} : { authorization },
      }),
    }),
  } as ExecutionContext;
}

function createGuard(config: ScimConfig): ScimAuthGuard {
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;

  return new ScimAuthGuard(configService);
}

function encodeBasicCredentials(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString('base64');
}

function expectUnauthorized(callback: () => unknown, message?: RegExp): UnauthorizedException {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);

    const unauthorizedError = error as UnauthorizedException;

    if (message) {
      expect(unauthorizedError.message).toMatch(message);
    }

    return unauthorizedError;
  }

  throw new Error('Expected UnauthorizedException');
}

describe('ScimAuthGuard', () => {
  it.each([undefined, 'false', 'TRUE'])('rejects requests when SCIM is not enabled (%p)', (enabled) => {
    const guard = createGuard({ SCIM_ENABLED: enabled });

    expectUnauthorized(() => guard.canActivate(createExecutionContext('Bearer valid-token')), /scim.*enabled/i);
  });

  it('rejects requests without an authorization header', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'valid-token',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext()), /authorization/i);
  });

  it.each(['', '   '])('rejects blank authorization header values (%j)', (authorization) => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'valid-token',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext(authorization)), /authorization/i);
  });

  it.each([['Bearer valid-token'], 123, { token: 'valid-token' }])(
    'rejects non-string or array authorization headers (%j)',
    (authorization) => {
      const guard = createGuard({
        SCIM_ENABLED: 'true',
        SCIM_HEADER_AUTH_TOKEN: 'valid-token',
      });

      expectUnauthorized(() => guard.canActivate(createExecutionContext(authorization)), /authorization/i);
    }
  );

  it('rejects malformed raw headers when the header token is unset', () => {
    const guard = createGuard({ SCIM_ENABLED: 'true' });

    expectUnauthorized(() => guard.canActivate(createExecutionContext('anything-without-a-space')), /token/i);
  });

  it.each(['Bearer', 'Bearer ', 'Bearer    '])('rejects a bearer scheme without a token (%j)', (authorization) => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext(authorization)), /authorization|token/i);
  });

  it('accepts a matching bearer token', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expect(guard.canActivate(createExecutionContext('Bearer shared-secret'))).toBe(true);
  });

  it('accepts an exact raw authorization token for backward compatibility', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expect(guard.canActivate(createExecutionContext('shared-secret'))).toBe(true);
  });

  it('requires an exact raw authorization token match', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext(' shared-secret ')), /token/i);
  });

  it('rejects wrong bearer and raw header tokens', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext('Bearer wrong-secret')), /token/i);
    expectUnauthorized(() => guard.canActivate(createExecutionContext('wrong-secret')), /token/i);
  });

  it('rejects an invalid bearer token even when both auth modes are configured', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext('Bearer wrong-secret')), /token/i);
  });

  it('accepts valid Basic authentication when both credentials are configured', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
    });

    expect(guard.canActivate(createExecutionContext(`Basic ${encodeBasicCredentials('customer', 'pass123')}`))).toBe(
      true
    );
  });

  it('rejects Basic authentication when credentials are wrong', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
    });

    expectUnauthorized(
      () => guard.canActivate(createExecutionContext(`Basic ${encodeBasicCredentials('customer', 'wrong')}`)),
      /basic/i
    );
  });

  it.each([{ SCIM_BASIC_AUTH_USER: 'customer' }, { SCIM_BASIC_AUTH_PASS: 'pass123' }])(
    'rejects Basic authentication when the configuration is incomplete: %j',
    (config) => {
      const guard = createGuard({
        SCIM_ENABLED: 'true',
        ...config,
      });

      expectUnauthorized(
        () => guard.canActivate(createExecutionContext(`Basic ${encodeBasicCredentials('customer', 'pass123')}`)),
        /basic/i
      );
    }
  );

  it.each(['Basic', 'Basic '])('rejects Basic authentication without encoded credentials (%j)', (authorization) => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext(authorization)), /authorization|basic/i);
  });

  it.each([
    'Basic not-base64!',
    `Basic ${Buffer.from('customer').toString('base64')}`,
    `Basic ${Buffer.from(':pass123').toString('base64')}`,
    `Basic ${Buffer.from('customer:').toString('base64')}`,
  ])('rejects malformed Basic payloads (%j)', (authorization) => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
    });

    expectUnauthorized(() => guard.canActivate(createExecutionContext(authorization)), /authorization|basic/i);
  });

  it('accepts both Basic and bearer auth when both modes are configured', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expect(guard.canActivate(createExecutionContext(`Basic ${encodeBasicCredentials('customer', 'pass123')}`))).toBe(
      true
    );
    expect(guard.canActivate(createExecutionContext('Bearer shared-secret'))).toBe(true);
  });

  it('does not leak configured secrets in runtime auth errors', () => {
    const guard = createGuard({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    const error = expectUnauthorized(() => guard.canActivate(createExecutionContext('Bearer wrong-secret')), /token/i);

    expect(error.message).not.toContain('shared-secret');
    expect(error.message).not.toContain('pass123');
  });
});
