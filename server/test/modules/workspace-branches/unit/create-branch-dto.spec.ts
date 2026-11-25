/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBranchDto } from '@modules/workspace-branches/dto';

/** @group platform */
describe('CreateBranchDto name validation', () => {
  const nameError = async (name: unknown) => {
    const errors = await validate(plainToInstance(CreateBranchDto, { name }));
    return errors.find((error) => error.property === 'name');
  };

  it.each(['feature-1', 'devtest_a', 'feature/login-page', 'release-1.2.0', 'a.b', 'UPPER', 'main-2', 'feature/main'])(
    'accepts %s',
    async (name) => {
      expect(await nameError(name)).toBeUndefined();
    }
  );

  // Names git refuses (git check-ref-format) fail in the worker after the job starts, so they must
  // be rejected at request time.
  it.each([
    ['consecutive dots', 'devtest..bad'],
    ['.lock suffix', 'devtest.lock'],
    ['leading dot', '.hidden'],
    ['trailing dot', 'branch.'],
    ['leading slash', '/branch'],
    ['trailing slash', 'branch/'],
    ['double slash', 'a//b'],
    ['component starting with a dot', 'a/.b'],
    ['component ending in .lock', 'a.lock/b'],
    ['whitespace', 'a b'],
    ['spaces only', '   '],
    ['control character', 'a\tb'],
    ['special ref characters', 'a~b'],
    ['colon', 'a:b'],
    ['question mark', 'a?b'],
    ['asterisk', 'a*b'],
    ['open bracket', 'a[b'],
    ['backslash', 'a\\b'],
    ['caret', 'a^b'],
    ['reflog syntax', 'a@{b'],
    ['a lone @', '@'],
    ['a leading dash', '-lead'],
    ['the reserved name HEAD', 'HEAD'],
    ['the reserved name main', 'main'],
    ['the reserved name master', 'master'],
    ['the reserved name origin', 'origin'],
    ['a reserved name in another case', 'Main'],
    ['a lowercase head', 'head'],
  ])('rejects %s', async (_label, name) => {
    expect(await nameError(name)).toBeDefined();
  });

  it('rejects an empty name', async () => {
    expect(await nameError('')).toBeDefined();
  });
});
