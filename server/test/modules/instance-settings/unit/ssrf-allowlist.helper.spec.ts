import { buildSSRFRuntimeConfig, normalizeSSRFAllowlistEntry } from '@helpers/ssrf-allowlist.helper';

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
});
