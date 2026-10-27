import {
  buildSSRFRuntimeConfig,
  isSSRFProtectionEnabledSetting,
  normalizeSSRFAllowlistEntry,
} from '@helpers/ssrf-allowlist.helper';

describe('ssrf-allowlist.helper', () => {
  describe('normalizeSSRFAllowlistEntry', () => {
    it.each([
      ['10.0.4.12', '10.0.4.12'],
      [' Jira.Corp ', 'jira.corp'],
      ['10.0.0.0/8', '10.0.0.0/8'],
      ['::1', '::1'],
      ['0.0.0.0/0', null],
      ['10.0.0.0/33', null],
      ['foo..bar', null],
      ['-x.com', null],
      ['my_service', 'my_service'],
      ['a_b.com', 'a_b.com'],
      ['_x', null],
      ['x_', null],
      ['', null],
    ])('normalises %j to %j', (input, expected) => {
      expect(normalizeSSRFAllowlistEntry(input)).toBe(expected);
    });
  });

  describe('buildSSRFRuntimeConfig', () => {
    it('keeps valid hostnames and ranges and skips invalid entries', () => {
      const config = buildSSRFRuntimeConfig(true, ['jira.corp', '10.0.4.0/24', 'bad..']);

      expect(config).toMatchObject({ enabled: true, allowedHostnames: new Set(['jira.corp']) });
      expect(config.allowedRanges.check('10.0.4.9', 'ipv4')).toBe(true);
      expect(config.allowedRanges.check('10.0.5.9', 'ipv4')).toBe(false);
    });

    it('treats a bare IP as a single-address range', () => {
      const config = buildSSRFRuntimeConfig(false, ['10.0.4.12']);

      expect(config.enabled).toBe(false);
      expect(config.allowedRanges.check('10.0.4.12', 'ipv4')).toBe(true);
      expect(config.allowedRanges.check('10.0.4.13', 'ipv4')).toBe(false);
    });
  });

  describe('isSSRFProtectionEnabledSetting', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it.each([
      ['true', 'development', true],
      ['true', 'production', true],
      ['false', 'development', false],
      ['false', 'production', false],
      ['', 'development', false],
      ['', 'production', true],
      ['', 'test', true],
      [undefined, 'development', false],
      [undefined, 'production', true],
      [null, 'production', true],
      ['yes', 'development', false],
      ['yes', 'production', true],
    ])('stored %j with NODE_ENV=%s is %s', (stored, nodeEnv, expected) => {
      process.env.NODE_ENV = nodeEnv;
      expect(isSSRFProtectionEnabledSetting(stored)).toBe(expected);
    });
  });
});
