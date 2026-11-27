import { parseTrustProxy } from '@helpers/trust-proxy.helper';

/**
 * @group platform
 */
describe('parseTrustProxy', () => {
  it.each([
    ['unset', undefined, undefined],
    ['empty', '', undefined],
    ['blank', '   ', undefined],
  ])('should leave Express untouched when %s', (_label, raw, expected) => {
    expect(parseTrustProxy(raw)).toBe(expected);
  });

  it.each([
    ['a hop count', '1', 1],
    ['a larger hop count', ' 2 ', 2],
    ['true (trust every proxy)', 'true', true],
    ['false', 'false', false],
    ['a named range', 'loopback', 'loopback'],
    ['a CIDR list', '10.0.0.0/8, 172.16.0.0/12', '10.0.0.0/8, 172.16.0.0/12'],
  ])('should pass %s to Express', (_label, raw, expected) => {
    expect(parseTrustProxy(raw)).toEqual(expected);
  });

  it.each([
    ['a negative number', '-1'],
    ['a fraction', '1.5'],
  ])('should reject %s', (_label, raw) => {
    expect(() => parseTrustProxy(raw)).toThrow(/TRUST_PROXY/);
  });
});
