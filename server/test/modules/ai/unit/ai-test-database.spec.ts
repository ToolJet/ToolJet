/** @group platform */
import { assertAiTestDatabase } from '../../../helpers/ai-test-database';

const actions = process.env.GITHUB_ACTIONS;
afterEach(() => {
  if (actions === undefined) delete process.env.GITHUB_ACTIONS;
  else process.env.GITHUB_ACTIONS = actions;
});

// Unsafe connection targets must be rejected before fixture setup can touch data.
test.each([
  undefined,
  'postgresql://localhost/tooljet_test',
  'postgresql://localhost/development',
  'postgresql://db.example.test/tooljet_ai_test_ci',
  'postgresql://localhost/tooljet_ai_test_ci?options=-csearch_path=public',
  'postgresql://localhost/tooljet_ai_test_ci#override',
  'https://localhost/tooljet_ai_test_ci',
])('rejects an absent or non-disposable connection (%s)', (connection) => {
  expect(() => assertAiTestDatabase(connection)).toThrow();
});

// Loopback databases are allowed only with the dedicated disposable test name.
test.each(['localhost', '127.0.0.1', '[::1]'])('allows a dedicated database on %s', (host) => {
  const connection = `postgresql://${host}:5439/tooljet_ai_test_fixture`;
  expect(assertAiTestDatabase(connection)).toBe(connection);
});

// The container service hostname is trusted only inside GitHub Actions.
test('allows the postgres service hostname only inside GitHub Actions', () => {
  const connection = 'postgresql://postgres/tooljet_ai_test_ci';
  delete process.env.GITHUB_ACTIONS;
  expect(() => assertAiTestDatabase(connection)).toThrow();
  process.env.GITHUB_ACTIONS = 'true';
  expect(assertAiTestDatabase(connection)).toBe(connection);
});
