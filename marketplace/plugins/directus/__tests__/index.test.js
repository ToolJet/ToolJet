const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Directus = require('../dist/index.js').default;

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function createPlugin() {
  return new Directus();
}

function sourceOptions(overrides = {}) {
  return {
    instanceUrl: 'https://directus.example.com/',
    accessToken: 'test-token',
    ...overrides,
  };
}

function queryOptions(overrides = {}) {
  return {
    operation: 'GET',
    path: '/users/me',
    params: {},
    specType: 'Users',
    ...overrides,
  };
}

test('rejects a missing instance URL', async () => {
  const plugin = createPlugin();

  await assert.rejects(
    plugin.run(sourceOptions({ instanceUrl: '' }), queryOptions(), 'test-id'),
    error => error.description.includes('Directus instance URL is required')
  );
});

test('rejects a missing access token', async () => {
  const plugin = createPlugin();

  await assert.rejects(
    plugin.run(sourceOptions({ accessToken: '' }), queryOptions(), 'test-id'),
    error => error.description.includes('Directus access token is required')
  );
});

test('sends a GET request with bearer authentication', async () => {
  const plugin = createPlugin();
  let capturedUrl;
  let capturedOptions;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;

    return new Response(JSON.stringify({ data: { id: 'user-1' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await plugin.run(
    sourceOptions(),
    queryOptions(),
    'test-id'
  );

  assert.equal(capturedUrl, 'https://directus.example.com/users/me');
  assert.equal(capturedOptions.method, 'GET');
  assert.equal(capturedOptions.headers.Authorization, 'Bearer test-token');
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.data, { data: { id: 'user-1' } });
});

test('serializes nested filters using bracket notation', async () => {
  const plugin = createPlugin();
  let capturedUrl;

  global.fetch = async (url) => {
    capturedUrl = url;
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  };

  await plugin.run(
    sourceOptions(),
    queryOptions({
      path: '/items/articles',
      params: {
        query: {
          filter: { status: { _eq: 'published' } },
          limit: 10,
        },
      },
    }),
    'test-id'
  );

  const parsedUrl = new URL(capturedUrl);

  assert.equal(parsedUrl.searchParams.get('filter[status][_eq]'), 'published');
  assert.equal(parsedUrl.searchParams.get('limit'), '10');
});

test('reports Directus API errors', async () => {
  const plugin = createPlugin();

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        errors: [{ message: 'Permission denied' }],
      }),
      { status: 403 }
    );

  await assert.rejects(
    plugin.run(sourceOptions(), queryOptions(), 'test-id'),
    error => error.description.includes('Permission denied')
  );
});

test('testConnection succeeds when Directus accepts the token', async () => {
  const plugin = createPlugin();

  global.fetch = async () =>
    new Response(JSON.stringify({ data: { id: 'user-1' } }), {
      status: 200,
    });

  const result = await plugin.testConnection(sourceOptions());

  assert.equal(result.status, 'ok');
});

test('testConnection reports invalid credentials', async () => {
  const plugin = createPlugin();

  global.fetch = async () =>
    new Response(JSON.stringify({ errors: [] }), { status: 401 });

  const result = await plugin.testConnection(sourceOptions());

  assert.equal(result.status, 'failed');
  assert.match(result.message, /Authentication failed/);
});
