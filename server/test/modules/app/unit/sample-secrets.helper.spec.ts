import { isSampleSecret, sampleSecretProblems } from '@helpers/sample-secrets.helper';

/** @group platform */
describe('isSampleSecret', () => {
  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['the example secret key base', 'replace_with_secret_key_base'],
    ['the example lockbox key', 'replace_with_lockbox_master_key'],
    ['the all-zero example lockbox key', '0'.repeat(64)],
    ['the old Helm chart key', '0123456789ABCDEF'],
  ])('flags %s', (_label, value) => {
    expect(isSampleSecret(value)).toBe(true);
  });

  it('accepts a generated key', () => {
    expect(isSampleSecret('9f'.repeat(32))).toBe(false);
  });
});

/** @group platform */
describe('sampleSecretProblems', () => {
  const realSecret = 'ab'.repeat(64);
  const realLockbox = 'cd'.repeat(32);

  it('is fatal in production when SECRET_KEY_BASE is an example value', () => {
    const problems = sampleSecretProblems({
      NODE_ENV: 'production',
      SECRET_KEY_BASE: 'replace_with_secret_key_base',
      LOCKBOX_MASTER_KEY: realLockbox,
    });
    expect(problems).toEqual({ fatal: expect.stringContaining('SECRET_KEY_BASE') });
  });

  it('only warns in production when LOCKBOX_MASTER_KEY is an example value', () => {
    const problems = sampleSecretProblems({
      NODE_ENV: 'production',
      SECRET_KEY_BASE: realSecret,
      LOCKBOX_MASTER_KEY: 'replace_with_lockbox_master_key',
    });
    expect(problems).toEqual({ warning: expect.stringContaining('LOCKBOX_MASTER_KEY') });
  });

  it('reports nothing in production with real keys', () => {
    expect(
      sampleSecretProblems({ NODE_ENV: 'production', SECRET_KEY_BASE: realSecret, LOCKBOX_MASTER_KEY: realLockbox })
    ).toEqual({});
  });

  it('reports nothing outside production', () => {
    expect(sampleSecretProblems({ NODE_ENV: 'development' })).toEqual({});
  });
});
