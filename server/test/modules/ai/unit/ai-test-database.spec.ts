/** @group working */
import { assertAiTestDatabase } from '../../../helpers/ai-test-database';

const actions = process.env.GITHUB_ACTIONS;
afterEach(() => {
  if (actions === undefined) delete process.env.GITHUB_ACTIONS;
  else process.env.GITHUB_ACTIONS = actions;
});

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

test.each(['localhost', '127.0.0.1', '[::1]'])('allows a dedicated database on %s', (host) => {
  const connection = `postgresql://${host}:5439/tooljet_ai_test_fixture`;
  expect(assertAiTestDatabase(connection)).toBe(connection);
});

test('allows the postgres service hostname only inside GitHub Actions', () => {
  const connection = 'postgresql://postgres/tooljet_ai_test_ci';
  delete process.env.GITHUB_ACTIONS;
  expect(() => assertAiTestDatabase(connection)).toThrow();
  process.env.GITHUB_ACTIONS = 'true';
  expect(assertAiTestDatabase(connection)).toBe(connection);
});
