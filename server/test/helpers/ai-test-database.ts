/** Only the dedicated local/CI throwaway database may receive AI test fixtures. */
export function assertAiTestDatabase(connection: string | undefined): string {
  if (!connection)
    throw new Error('AI database tests require ATTACHMENT_TEST_DATABASE_URL; use npm run test:ai:local.');
  const url = new URL(connection);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const ciService = process.env.GITHUB_ACTIONS === 'true' && url.hostname === 'postgres';
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    (!local && !ciService) ||
    !/^\/tooljet_ai_test_[a-z0-9_]+$/.test(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'AI tests require an isolated PostgreSQL database named tooljet_ai_test_* on loopback or the CI postgres service.'
    );
  }
  return connection;
}
