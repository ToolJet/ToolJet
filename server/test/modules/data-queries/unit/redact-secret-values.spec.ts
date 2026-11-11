import { redactSecretValues } from '@helpers/utils.helper';

/** @group platform */
describe('redactSecretValues', () => {
  const SECRET = 's3cr3t-token-DEADBEEF';

  it('redacts a resolved secret value inside a custom (non-blacklisted) header', () => {
    const metadata = { request: { headers: { 'x-custom-auth': SECRET, authorization: '[REDACTED]' } } };
    expect(redactSecretValues(metadata, [SECRET])).toEqual({
      request: { headers: { 'x-custom-auth': '[REDACTED]', authorization: '[REDACTED]' } },
    });
  });

  it('redacts a resolved secret value inside URL params and the resolved url', () => {
    const metadata = {
      request: { url: `https://example.com/?marker=${SECRET}`, params: { marker: SECRET } },
    };
    expect(redactSecretValues(metadata, [SECRET])).toEqual({
      request: { url: 'https://example.com/?marker=[REDACTED]', params: { marker: '[REDACTED]' } },
    });
  });

  it('redacts the secret even when embedded in a larger string (e.g. Bearer <secret>)', () => {
    const metadata = { request: { headers: { 'x-auth': `Bearer ${SECRET}` } } };
    expect(redactSecretValues(metadata, [SECRET])).toEqual({
      request: { headers: { 'x-auth': 'Bearer [REDACTED]' } },
    });
  });

  it('redacts every provided secret value', () => {
    expect(redactSecretValues({ a: 'alpha', b: 'beta' }, ['alpha', 'beta'])).toEqual({
      a: '[REDACTED]',
      b: '[REDACTED]',
    });
  });

  it('leaves non-secret values unchanged', () => {
    const metadata = { request: { params: { marker: 'public-value' } } };
    expect(redactSecretValues(metadata, [SECRET])).toEqual(metadata);
  });

  it('is a no-op when there are no secret values collected', () => {
    const metadata = { request: { params: { marker: SECRET } } };
    expect(redactSecretValues(metadata, [])).toEqual(metadata);
    expect(redactSecretValues(metadata, undefined as unknown as string[])).toEqual(metadata);
  });

  it('ignores empty/invalid secret values so unrelated metadata is not clobbered', () => {
    const metadata = { request: { params: { marker: 'keep-me' } } };
    expect(redactSecretValues(metadata, ['', null as unknown as string])).toEqual(metadata);
  });

  it('handles null/undefined metadata gracefully', () => {
    expect(redactSecretValues(null, [SECRET])).toBeNull();
    expect(redactSecretValues(undefined, [SECRET])).toBeUndefined();
  });
});
