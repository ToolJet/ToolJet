import { validateVersionName, validateVersionDescription } from '../versionValidation';

describe('shared version metadata validation', () => {
  it.each(['v1', 'v1.2', 'release/candidate', 'a+b', 'a_b', 'a-b', '版本', 'a!b', 'a'.repeat(25)])(
    'accepts the existing permitted name %s',
    (name) => {
      expect(validateVersionName(name)).toBe('');
    }
  );
  it.each(['', '   ', 'bad name', 'bad\tname', ...'~^:?*[]\\@{'].map((value) => [value]))(
    'rejects empty or forbidden name %s',
    (name) => {
      expect(validateVersionName(name)).not.toBe('');
    }
  );
  it('pins the 25/500 limits and trims only for name whitespace validation', () => {
    expect(validateVersionName('a'.repeat(26))).not.toBe('');
    expect(validateVersionName(' v1 ')).toBe('');
    expect(validateVersionDescription('')).toBe('');
    expect(validateVersionDescription('a'.repeat(500))).toBe('');
    expect(validateVersionDescription('a'.repeat(501))).not.toBe('');
  });
});
