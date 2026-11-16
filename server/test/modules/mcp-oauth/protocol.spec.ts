import { parseRegistration } from '@modules/mcp-oauth/parsers';
import { isPublicOAuthProtocolPath } from '@modules/mcp-oauth/http-security';
import {
  scopesParam,
  validateRedirects,
  trustedUrl,
  hash,
  equalSecret,
  matchesRedirectUri,
  clientAuthentication,
} from '@modules/mcp-oauth/protocol';

describe('MCP OAuth protocol validation', () => {
  test('rejects every ASCII control character in registered client names', () => {
    const redirect_uris = ['https://client.synthetic.example/callback'];
    for (const code of [...Array.from({ length: 32 }, (_, index) => index), 127]) {
      expect(() => parseRegistration({ redirect_uris, client_name: `Client${String.fromCharCode(code)}name` })).toThrow(
        expect.objectContaining({ error: 'invalid_client_metadata' })
      );
    }
  });
  test('preserves Unicode client names and the existing length boundary', () => {
    const redirect_uris = ['https://client.synthetic.example/callback'];
    const name = 'é'.repeat(120);
    expect(parseRegistration({ redirect_uris, client_name: name }).name).toBe(name);
    expect(() => parseRegistration({ redirect_uris, client_name: name + 'x' })).toThrow(
      expect.objectContaining({ error: 'invalid_client_metadata' })
    );
  });
  test('parses public, post, and form-encoded Basic client credentials', () => {
    expect(clientAuthentication({ client_id: 'synthetic-client' })).toEqual({
      method: 'none',
      clientId: 'synthetic-client',
    });
    expect(clientAuthentication({ client_id: 'synthetic-client', client_secret: 'synthetic-secret' })).toEqual({
      method: 'client_secret_post',
      clientId: 'synthetic-client',
      clientSecret: 'synthetic-secret',
    });
    const header = `Basic ${Buffer.from('synthetic%3Aclient:synthetic%2Bsecret').toString('base64')}`;
    expect(clientAuthentication({}, header)).toEqual({
      method: 'client_secret_basic',
      clientId: 'synthetic:client',
      clientSecret: 'synthetic+secret',
    });
  });
  test.each([
    'Bearer synthetic-token',
    'Basic !',
    'Basic Og==',
    `Basic ${Buffer.from('synthetic-client:').toString('base64')}`,
    `Basic ${Buffer.from('synthetic-client:%zz').toString('base64')}`,
  ])('rejects invalid header client authentication: %s', (header) => {
    expect(() => clientAuthentication({}, header)).toThrow();
  });
  test('rejects mixed authentication methods and non-string body credentials', () => {
    const header = `Basic ${Buffer.from('synthetic-client:synthetic-secret').toString('base64')}`;
    for (const body of [{ client_id: 'synthetic-client' }, { client_secret: 'synthetic-secret' }])
      expect(() => clientAuthentication(body, header)).toThrow('one client authentication method');
    for (const client_secret of ['', null, ['synthetic-secret']])
      expect(() => clientAuthentication({ client_id: 'synthetic-client', client_secret })).toThrow();
  });
  test.each([
    'http://example.org/cb',
    'https://user:password@example.org/cb',
    'https://example.org/#fragment',
    'javascript:alert(1)',
    'https://example.org/*',
  ])('rejects unsafe redirect %s', (url) => {
    expect(() => validateRedirects([url])).toThrow();
  });
  test.each(['https://client.example/callback', 'http://127.0.0.1:4242/callback', 'http://[::1]:4242/callback'])(
    'accepts exact secure/native redirect %s',
    (url) => {
      expect(validateRedirects([url])).toEqual([url]);
    }
  );
  test('accepts Cursor desktop registration without trusting its native callback as an issuer or resource', () => {
    const native = 'cursor://anysphere.cursor-mcp/oauth/callback';
    const redirects = [native, 'https://www.cursor.com/agents/mcp/oauth/callback', 'http://localhost:8787/callback'];
    expect(validateRedirects(redirects)).toEqual(redirects);
    expect(matchesRedirectUri(native, native)).toBe(true);
    expect(() => trustedUrl(native)).toThrow();
  });
  test.each([
    'cursor://anysphere.cursor-mcp:8787/oauth/callback',
    'cursor://anysphere.cursor-mcp/oauth/callback?target=other',
    'cursor://anysphere.cursor-mcp/oauth/callback#fragment',
    'cursor://user@anysphere.cursor-mcp/oauth/callback',
    'cursor://anysphere.cursor-mcp.evil.example/oauth/callback',
    'cursor://anysphere.cursor-mcp/oauth/callback/extra',
    'cursor://anysphere.cursor-mcp/oauth/../oauth/callback',
    'cursor://anysphere.cursor-mcp/oauth/%63allback',
    'cursor://anysphere.cursor-mcp/OAuth/callback',
    'CURSOR://anysphere.cursor-mcp/oauth/callback',
    'cursor://ANYSPHERE.cursor-mcp/oauth/callback',
    'vscode://anysphere.cursor-mcp/oauth/callback',
  ])('rejects altered native Cursor callback %s', (uri) => {
    const native = 'cursor://anysphere.cursor-mcp/oauth/callback';
    expect(() => validateRedirects([uri])).toThrow();
    expect(matchesRedirectUri(uri, native)).toBe(false);
    expect(matchesRedirectUri(native, uri)).toBe(false);
    expect(matchesRedirectUri(uri, uri)).toBe(false);
  });
  test('does not accept arrays, unsupported scopes or misleading whitespace', () => {
    expect(scopesParam(undefined)).toEqual(['apps', 'data', 'workflows', 'workspace_users']);
    expect(scopesParam('workflows workspace_users')).toEqual(['workflows', 'workspace_users']);
    expect(scopesParam('apps apps')).toEqual(['apps']);
    for (const value of ['admin', 'apps  data', ['apps'], null]) expect(() => scopesParam(value)).toThrow();
  });
  test('hashes credentials and compares without length-dependent secret comparisons', () => {
    expect(hash('synthetic-secret')).toHaveLength(64);
    expect(equalSecret('same', 'same')).toBe(true);
    expect(equalSecret('a', 'longer')).toBe(false);
    expect(() => trustedUrl('https://example.org/#fragment')).toThrow();
  });
  test.each(['127.0.0.1', '[::1]', 'localhost'])('accepts only a changed native HTTP port for %s', (host) => {
    const callback = `http://${host}:43125/callback?channel=desktop`;
    expect(matchesRedirectUri(callback, `http://${host}:52017/callback?channel=desktop`)).toBe(true);
    expect(matchesRedirectUri(callback, `http://${host}/callback?channel=desktop`)).toBe(true);
  });
  test.each([
    ['https://client.example:43125/callback', 'https://client.example:52017/callback'],
    ['https://localhost:43125/callback', 'https://localhost:52017/callback'],
    ['http://127.0.0.1:43125/other', 'http://127.0.0.1:52017/callback'],
    ['http://127.0.0.1:43125/callback?channel=other', 'http://127.0.0.1:52017/callback?channel=desktop'],
    ['http://localhost:43125/callback', 'http://127.0.0.1:52017/callback'],
    ['http://127.0.0.1:43125/callback', 'http://[::1]:52017/callback'],
    ['http://127.0.0.1.evil.example:43125/callback', 'http://127.0.0.1:52017/callback'],
    ['http://127.0.0.1:43125/path/../callback', 'http://127.0.0.1:52017/callback'],
    ['http://127.0.0.1:43125/%63allback', 'http://127.0.0.1:52017/callback'],
    ['http://127.0.0.1:43125/callback#fragment', 'http://127.0.0.1:52017/callback'],
    ['http://user@127.0.0.1:43125/callback', 'http://127.0.0.1:52017/callback'],
  ])('does not broaden callback matching from %s to %s', (requested, registered) => {
    expect(matchesRedirectUri(requested, registered)).toBe(false);
  });
});

test('only cookie-free protocol endpoints bypass browser origin checks, including subpaths', () => {
  expect(isPublicOAuthProtocolPath('/api/mcp-oauth/token')).toBe(true);
  expect(isPublicOAuthProtocolPath('/tools/api/mcp-oauth/register', '/tools/')).toBe(true);
  for (const path of [
    '/api/mcp-oauth/interactions/id',
    '/api/mcp-oauth/connections/id/revoke',
    '/api/mcp-oauth/exchange',
    '/api/mcp-oauth/token/extra',
  ]) {
    expect(isPublicOAuthProtocolPath(path)).toBe(false);
  }
});
