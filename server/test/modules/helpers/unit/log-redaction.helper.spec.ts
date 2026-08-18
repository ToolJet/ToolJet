import { redactSensitiveKeys } from '../../../../src/helpers/log-redaction.helper';

describe('redactSensitiveKeys', () => {
  it('redacts a sensitive key at the top level', () => {
    expect(redactSensitiveKeys({ password: 'hunter2', host: 'db.internal' })).toEqual({
      password: '[REDACTED]',
      host: 'db.internal',
    });
  });

  it('redacts sensitive keys nested arbitrarily deep', () => {
    const input = { host: 'db.internal', auth: { token: 'abc.def.ghi', user: 'admin' } };

    expect(redactSensitiveKeys(input)).toEqual({
      host: 'db.internal',
      auth: { token: '[REDACTED]', user: 'admin' },
    });
  });

  it('redacts sensitive keys inside arrays of objects', () => {
    const input = [{ api_key: 'k-1' }, { name: 'ok' }];

    expect(redactSensitiveKeys(input)).toEqual([{ api_key: '[REDACTED]' }, { name: 'ok' }]);
  });

  it('matches key names case-insensitively', () => {
    expect(redactSensitiveKeys({ Password: 'hunter2', SECRET: 'shh' })).toEqual({
      Password: '[REDACTED]',
      SECRET: '[REDACTED]',
    });
  });

  it('leaves non-sensitive values, including nested primitives, untouched', () => {
    const input = { ssl: false, port: 5432, tags: ['a', 'b'] };

    expect(redactSensitiveKeys(input)).toEqual(input);
  });

  it('does not loop forever on a circular reference', () => {
    const input: Record<string, unknown> = { name: 'x' };
    input.self = input;

    expect(() => redactSensitiveKeys(input)).not.toThrow();
    expect((redactSensitiveKeys(input) as Record<string, unknown>).self).toBe('[CIRCULAR]');
  });

  it('passes through non-object values unchanged', () => {
    expect(redactSensitiveKeys('plain string')).toBe('plain string');
    expect(redactSensitiveKeys(42)).toBe(42);
    expect(redactSensitiveKeys(null)).toBe(null);
    expect(redactSensitiveKeys(undefined)).toBe(undefined);
  });
});
