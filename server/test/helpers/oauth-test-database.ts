/** OAuth fixtures must never connect to an application or remote database. */
export function assertOAuthTestDatabase(connection: string | undefined): URL {
  if (!connection) throw new Error('Set MCP_OAUTH_TEST_DATABASE_URL to a disposable tooljet_oauth_test_* database');
  const url = new URL(connection);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  const ciService = process.env.GITHUB_ACTIONS === 'true' && url.hostname === 'postgres';
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    (!local && !ciService) ||
    !/^\/tooljet_oauth_test_[a-z0-9_]+$/.test(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'OAuth fixtures require a disposable tooljet_oauth_test_* database on loopback or the CI postgres service'
    );
  }
  return url;
}
