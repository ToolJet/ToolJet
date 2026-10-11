const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { default: Gitlab } = require('../dist/index.js');
const manifest = require('../lib/manifest.json');
const operations = require('../lib/operations.json');

const plugin = new Gitlab();
const source = { base_url: 'https://gitlab.example.com/gitlab/', personal_token: 'private-token' };
const oauth = { ...source, auth_type: 'oauth2', client_id: 'client&id', client_secret: 'secret', tj_redirect_host: 'https://tooljet.example.com' };
let requests;
let respond;
let originalFetch;
let originalSubpath;

beforeEach(() => {
  originalFetch = global.fetch;
  originalSubpath = process.env.SUB_PATH;
  delete process.env.SUB_PATH;
  requests = [];
  respond = () => new Response(JSON.stringify({ id: 42 }), { status: 200 });
  global.fetch = async (url, init) => {
    requests.push({ url: new URL(url), ...init });
    return respond();
  };
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalSubpath === undefined) delete process.env.SUB_PATH;
  else process.env.SUB_PATH = originalSubpath;
});

const cases = [
  ['list_projects', 'GET', '/projects', {}],
  ['get_project', 'GET', '/projects/team%2Fproject', { project_id: 'team/project' }],
  ['list_issues', 'GET', '/projects/42/issues', { project_id: 42 }],
  ['create_issue', 'POST', '/projects/42/issues', { project_id: 42, title: 'Bug', description: 'Details' }, { title: 'Bug', description: 'Details' }],
  ['update_issue', 'PUT', '/projects/42/issues/7', { project_id: 42, issue_iid: 7, body: '{"state_event":"close","labels":[]}' }, { state_event: 'close', labels: [] }],
  ['list_merge_requests', 'GET', '/projects/42/merge_requests', { project_id: 42 }],
  ['create_merge_request', 'POST', '/projects/42/merge_requests', { project_id: 42, title: 'Fix', source_branch: 'fix/bug', target_branch: 'main' }, { title: 'Fix', source_branch: 'fix/bug', target_branch: 'main' }],
  ['merge_merge_request', 'PUT', '/projects/42/merge_requests/8/merge', { project_id: 42, merge_request_iid: 8, body: { squash: false, sha: 'abc' } }, { squash: false, sha: 'abc' }],
  ['list_branches', 'GET', '/projects/42/repository/branches', { project_id: 42 }],
  ['get_file', 'GET', '/projects/team%2Fproject/repository/files/src%2Ffile%20name.ts', { project_id: 'team/project', file_path: 'src/file name.ts', ref: 'feature/a' }],
  ['list_pipelines', 'GET', '/projects/42/pipelines', { project_id: 42 }],
  ['trigger_pipeline', 'POST', '/projects/42/pipeline', { project_id: 42, ref: 'main', body: { variables: [{ key: 'DEPLOY', value: 'true' }] } }, { ref: 'main', variables: [{ key: 'DEPLOY', value: 'true' }] }],
  ['list_users', 'GET', '/users', {}],
];

for (const [operation, method, path, inputs, body] of cases) {
  test(`${operation} calls the GitLab endpoint and returns usable JSON`, async () => {
    const data = method === 'GET' && operation !== 'get_project' && operation !== 'get_file' ? [{ id: 42 }] : { id: 42 };
    respond = () => new Response(JSON.stringify(data));
    const result = await plugin.run(source, { operation, ...inputs, parameters: { page: 2, per_page: 20, owned: false } });
    assert.deepEqual(result, { status: 'ok', data });
    assert.equal(requests[0].url.pathname, `/gitlab/api/v4${path}`);
    assert.equal(requests[0].method, method);
    assert.equal(requests[0].headers['PRIVATE-TOKEN'], 'private-token');
    assert.equal(requests[0].url.searchParams.get('page'), '2');
    assert.equal(requests[0].url.searchParams.get('owned'), 'false');
    if (body) assert.deepEqual(JSON.parse(requests[0].body), body);
    else assert.equal(requests[0].body, undefined);
    if (operation === 'get_file') assert.equal(requests[0].url.searchParams.get('ref'), 'feature/a');
  });
}

test('all minimum operations are selectable and all credentials are encrypted', () => {
  assert.deepEqual(operations.properties.operation.list.map(({ value }) => value).sort(), cases.map(([name]) => name).sort());
  for (const key of ['personal_token', 'client_secret', 'access_token', 'refresh_token']) {
    assert.equal(manifest.source.options[key].encrypted, true);
  }
  assert.equal(manifest.defaults.base_url.value, 'https://gitlab.com');
  assert.deepEqual(manifest.properties.credentials.list.map(({ value }) => value), ['personal_access_token', 'oauth2']);
});

test('test connection supports personal and project tokens and defaults to GitLab.com', async () => {
  assert.deepEqual(await plugin.testConnection({ personal_token: 'project-token' }), { status: 'ok' });
  assert.equal(requests[0].url.href, 'https://gitlab.com/api/v4/user');
  assert.equal(requests[0].headers['PRIVATE-TOKEN'], 'project-token');
});

test('OAuth query and connection test use bearer authentication', async () => {
  const options = { ...oauth, access_token: 'oauth-token' };
  await plugin.run(options, { operation: 'list_users' });
  await plugin.testConnection(options);
  for (const request of requests) {
    assert.equal(request.headers.Authorization, 'Bearer oauth-token');
    assert.equal(request.headers['PRIVATE-TOKEN'], undefined);
  }
});

test('OAuth URL accepts form and parsed options and preserves both installation subpaths', () => {
  process.env.SUB_PATH = '/tooljet/';
  const formOptions = Object.fromEntries(Object.entries(oauth).map(([key, value]) => [key, { value }]));
  for (const options of [oauth, formOptions, Object.entries(oauth).map(([key, value]) => ({ key, value }))]) {
    const url = new URL(plugin.authUrl(options));
    assert.equal(url.origin + url.pathname, 'https://gitlab.example.com/gitlab/oauth/authorize');
    assert.equal(url.searchParams.get('client_id'), 'client&id');
    assert.equal(url.searchParams.get('scope'), 'api');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://tooljet.example.com/tooljet/oauth2/authorize');
  }
});

test('OAuth callback exchanges the code and refresh rotates both tokens on the configured instance', async () => {
  respond = () => new Response(JSON.stringify({ access_token: 'new-access', refresh_token: 'new-refresh' }));
  assert.deepEqual(await plugin.accessDetailsFrom('code&value', Object.entries(oauth).map(([key, value]) => ({ key, value }))), [
    ['access_token', 'new-access'], ['refresh_token', 'new-refresh'],
  ]);
  assert.deepEqual(await plugin.refreshToken({ ...oauth, refresh_token: 'old-refresh' }), { access_token: 'new-access', refresh_token: 'new-refresh' });
  assert.deepEqual(await plugin.accessDetailsFrom('', oauth, true), [['access_token', ''], ['refresh_token', '']]);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.url.href, 'https://gitlab.example.com/gitlab/oauth/token');
    assert.equal(request.headers['Content-Type'], 'application/x-www-form-urlencoded');
    const body = new URLSearchParams(request.body);
    assert.equal(body.get('client_secret'), 'secret');
    assert.equal(body.get('redirect_uri'), 'https://tooljet.example.com/oauth2/authorize');
  }
  assert.equal(new URLSearchParams(requests[0].body).get('code'), 'code&value');
  assert.equal(new URLSearchParams(requests[1].body).get('refresh_token'), 'old-refresh');
});

test('OAuth requests authorization when credentials are absent', async () => {
  assert.equal((await plugin.run(oauth, { operation: 'list_projects' })).status, 'needs_oauth');
  assert.equal(requests.length, 0);
  await assert.rejects(plugin.run(oauth, { operation: 'list_projects' }, '', '', { app: { isPublic: true } }), { description: 'Authorize the GitLab data source before running this public app' });
});

test('per-user OAuth uses only the current user token, including during refresh', async () => {
  const options = { ...oauth, multiple_auth_enabled: true, tokenData: [
    { user_id: 'other', access_token: 'other-token', refresh_token: 'other-refresh' },
    { user_id: 'current', access_token: 'current-token', refresh_token: 'current-refresh' },
  ] };
  await plugin.run(options, { operation: 'list_users' }, '', '', { user: { id: 'current' } });
  assert.equal(requests[0].headers.Authorization, 'Bearer current-token');
  assert.equal((await plugin.run(options, { operation: 'list_users' }, '', '', { user: { id: 'missing' } })).status, 'needs_oauth');
  respond = () => new Response(JSON.stringify({ access_token: 'new', refresh_token: 'rotated' }));
  await plugin.refreshToken(options, '', 'current');
  assert.equal(new URLSearchParams(requests[1].body).get('refresh_token'), 'current-refresh');
});

test('invalid inputs fail before making requests', async () => {
  for (const query of [
    { operation: 'unknown' },
    { operation: 'get_project' },
    { operation: 'create_issue', project_id: 42 },
    { operation: 'create_merge_request', project_id: 42, title: 'Missing branches' },
    { operation: 'get_file', project_id: 42, file_path: 'README.md' },
    { operation: 'trigger_pipeline', project_id: 42 },
    { operation: 'list_users', parameters: '{bad json' },
    { operation: 'update_issue', project_id: 42, issue_iid: 1, body: '[]' },
  ]) await assert.rejects(plugin.run(source, query));
  assert.deepEqual((await plugin.testConnection({ ...source, personal_token: '' })).status, 'failed');
  assert.equal(requests.length, 0);
});

for (const status of [401, 403, 404, 422, 429, 500]) {
  test(`GitLab HTTP ${status} errors are clear without exposing request credentials`, async () => {
    respond = () => new Response(JSON.stringify({ message: { title: ['is required'] } }), { status });
    await assert.rejects(plugin.run(source, { operation: 'list_users' }), (error) => {
      assert.equal(error.name, 'QueryError');
      assert.equal(error.description, `HTTP ${status}: {"title":["is required"]}`);
      assert.deepEqual(error.data, { statusCode: status });
      assert.ok(!JSON.stringify(error).includes('private-token'));
      return true;
    });
    assert.equal((await plugin.testConnection(source)).status, 'failed');
  });
}

test('expired OAuth token signals ToolJet to refresh, but access token errors do not', async () => {
  respond = () => new Response('{"message":"401 Unauthorized"}', { status: 401 });
  await assert.rejects(plugin.run({ ...oauth, access_token: 'expired' }, { operation: 'list_users' }), { name: 'OAuthUnauthorizedClientError' });
  await assert.rejects(plugin.run(source, { operation: 'list_users' }), { name: 'QueryError' });
});

test('non-JSON and network failures produce actionable connection errors', async () => {
  respond = () => new Response('<html>Bad Gateway</html>', { status: 502 });
  assert.match((await plugin.testConnection(source)).message, /HTTP 502.*non-JSON/);
  respond = () => { throw new Error('Connection timed out'); };
  assert.equal((await plugin.testConnection(source)).message, 'Connection timed out');
});

test('revoked OAuth refresh tokens request reauthorization instead of repeating the query', async () => {
  respond = () => new Response('{"error":"invalid_grant","error_description":"Refresh token revoked"}', { status: 400 });
  await assert.rejects(plugin.refreshToken({ ...oauth, refresh_token: 'revoked' }), {
    name: 'OAuthUnauthorizedClientError', description: 'HTTP 400: Refresh token revoked',
  });
});

test('invalid base URLs and missing OAuth credentials fail without sending requests', async () => {
  for (const base_url of ['not a URL', 'ftp://example.com', 'https://user:pass@example.com', 'https://example.com?token=secret']) {
    assert.equal((await plugin.testConnection({ ...source, base_url })).status, 'failed');
  }
  assert.throws(() => plugin.authUrl({ ...oauth, client_id: '' }));
  await assert.rejects(plugin.accessDetailsFrom('code', { ...oauth, client_secret: '' }));
  assert.equal(requests.length, 0);
});
