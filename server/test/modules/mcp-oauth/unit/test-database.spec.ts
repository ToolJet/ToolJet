/** @group working */
import { assertOAuthTestDatabase } from '../../../helpers/oauth-test-database';

describe('OAuth test database boundary', () => {
  const original = process.env.GITHUB_ACTIONS;
  afterEach(() => {
    if (original === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = original;
  });
  test.each([
    undefined,
    'postgresql://tester:fixture@localhost/application',
    'postgresql://tester:fixture@database.example/tooljet_oauth_test_case',
    'postgresql://tester:fixture@localhost/tooljet_oauth_test_case?options=unsafe',
    'postgresql://tester:fixture@localhost/tooljet_oauth_test_case#fragment',
    'https://localhost/tooljet_oauth_test_case',
  ])('rejects an unsafe fixture target: %s', (value) => {
    delete process.env.GITHUB_ACTIONS;
    expect(() => assertOAuthTestDatabase(value)).toThrow();
  });
  test('accepts a named local fixture', () => {
    expect(
      assertOAuthTestDatabase('postgresql://tester:fixture@127.0.0.1:55432/tooljet_oauth_test_case').hostname
    ).toBe('127.0.0.1');
  });
  test('accepts the postgres service only inside GitHub Actions', () => {
    const value = 'postgresql://tester:fixture@postgres:5432/tooljet_oauth_test_case';
    delete process.env.GITHUB_ACTIONS;
    expect(() => assertOAuthTestDatabase(value)).toThrow();
    process.env.GITHUB_ACTIONS = 'true';
    expect(assertOAuthTestDatabase(value).hostname).toBe('postgres');
  });
});
