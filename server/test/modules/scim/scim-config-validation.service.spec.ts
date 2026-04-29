import { ConfigService } from '@nestjs/config';
import { ScimConfigValidationService } from '../../../src/modules/scim/services/scim-config-validation.service';

type ScimConfig = Record<string, string | undefined>;

function createService(config: ScimConfig): ScimConfigValidationService {
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;

  return new ScimConfigValidationService(configService);
}

describe('ScimConfigValidationService', () => {
  it.each([undefined, 'false', 'TRUE'])('does nothing when SCIM_ENABLED is %p', (enabled) => {
    const service = createService({
      SCIM_ENABLED: enabled,
      SCIM_BASIC_AUTH_USER: 'customer',
    });

    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('throws when SCIM is enabled without any authentication mode', () => {
    const service = createService({ SCIM_ENABLED: 'true' });

    expect(() => service.onModuleInit()).toThrow(/no authentication mode/i);
  });

  it.each([
    {
      description: 'username only',
      config: { SCIM_BASIC_AUTH_USER: 'customer' },
    },
    {
      description: 'password only',
      config: { SCIM_BASIC_AUTH_PASS: 'pass123' },
    },
    {
      description: 'username only even when header-token auth is otherwise valid',
      config: {
        SCIM_BASIC_AUTH_USER: 'customer',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
    {
      description: 'password only even when header-token auth is otherwise valid',
      config: {
        SCIM_BASIC_AUTH_PASS: 'pass123',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
  ])('throws when Basic authentication is partially configured: $description', ({ config }) => {
    const service = createService({
      SCIM_ENABLED: 'true',
      ...config,
    });

    expect(() => service.onModuleInit()).toThrow(/basic.*incomplete/i);
  });

  it.each([
    {
      description: 'blank username',
      config: {
        SCIM_BASIC_AUTH_USER: ' ',
        SCIM_BASIC_AUTH_PASS: 'pass123',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
    {
      description: 'blank password',
      config: {
        SCIM_BASIC_AUTH_USER: 'customer',
        SCIM_BASIC_AUTH_PASS: ' ',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
    {
      description: 'empty username',
      config: {
        SCIM_BASIC_AUTH_USER: '',
        SCIM_BASIC_AUTH_PASS: 'pass123',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
    {
      description: 'empty password',
      config: {
        SCIM_BASIC_AUTH_USER: 'customer',
        SCIM_BASIC_AUTH_PASS: '',
        SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
      },
    },
  ])('throws when Basic authentication contains blank values: $description', ({ config }) => {
    const service = createService({
      SCIM_ENABLED: 'true',
      ...config,
    });

    expect(() => service.onModuleInit()).toThrow(/basic.*blank/i);
  });

  it.each([
    { description: 'empty string', token: '' },
    { description: 'whitespace-only string', token: ' ' },
    { description: 'multiple spaces', token: '   ' },
  ])('throws when the header token is blank: $description', ({ token }) => {
    const service = createService({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
      SCIM_HEADER_AUTH_TOKEN: token,
    });

    expect(() => service.onModuleInit()).toThrow(/SCIM_HEADER_AUTH_TOKEN.*blank/i);
  });

  it('throws when a blank header token is the only configured auth mode', () => {
    const service = createService({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: ' ',
    });

    expect(() => service.onModuleInit()).toThrow(/scim/i);
  });

  it('passes with complete Basic authentication', () => {
    const service = createService({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
    });

    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('passes with a valid header token', () => {
    const service = createService({
      SCIM_ENABLED: 'true',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('passes when both auth modes are configured', () => {
    const service = createService({
      SCIM_ENABLED: 'true',
      SCIM_BASIC_AUTH_USER: 'customer',
      SCIM_BASIC_AUTH_PASS: 'pass123',
      SCIM_HEADER_AUTH_TOKEN: 'shared-secret',
    });

    expect(() => service.onModuleInit()).not.toThrow();
  });
});
