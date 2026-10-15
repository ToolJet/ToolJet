import { ConfigService } from '@modules/configs/service';
import { getMcpOAuthPublicConfig } from '@modules/configs/mcp-oauth-public-config';

const enabled = {
  TOOLJET_EDITION: 'cloud',
  MCP_OAUTH_ENABLED: 'true',
  MCP_OAUTH_RESOURCE_URL: 'https://mcp.example.test/tools/mcp/',
};
const disabled = { MCP_OAUTH_ENABLED: 'false', MCP_OAUTH_RESOURCE_URL: null };

test('publishes only the enabled Cloud resource, preserving its subpath', () => {
  expect(
    getMcpOAuthPublicConfig({
      ...enabled,
      MCP_OAUTH_EXCHANGE_SECRET: 'synthetic-private-secret',
    })
  ).toEqual({
    MCP_OAUTH_ENABLED: 'true',
    MCP_OAUTH_RESOURCE_URL: 'https://mcp.example.test/tools/mcp',
  });
});

test.each(['ee', 'ce', undefined])('hides OAuth connection information for edition %s', (edition) => {
  expect(getMcpOAuthPublicConfig({ ...enabled, TOOLJET_EDITION: edition })).toEqual(disabled);
});

test.each(['false', '', undefined])('hides OAuth when enablement is %s', (flag) => {
  expect(getMcpOAuthPublicConfig({ ...enabled, MCP_OAUTH_ENABLED: flag })).toEqual(disabled);
});

test.each([
  undefined,
  '',
  '/mcp',
  'not-a-url',
  'http://mcp.example.test/mcp',
  'ftp://mcp.example.test/mcp',
  'https://name:secret@mcp.example.test/mcp',
  'https://mcp.example.test/mcp?token=synthetic',
  'https://mcp.example.test/mcp#fragment',
])('hides OAuth for an absent or unsafe resource URL: %s', (resource) => {
  expect(getMcpOAuthPublicConfig({ ...enabled, MCP_OAUTH_RESOURCE_URL: resource })).toEqual(disabled);
});

test.each(['localhost', '127.0.0.1', '[::1]'])('supports HTTP loopback development on %s', (host) => {
  const resource = `http://${host}:8787/mcp`;
  expect(getMcpOAuthPublicConfig({ ...enabled, MCP_OAUTH_RESOURCE_URL: resource })).toEqual({
    MCP_OAUTH_ENABLED: 'true',
    MCP_OAUTH_RESOURCE_URL: resource,
  });
});

describe('public config integration', () => {
  const originalEnv = process.env;
  const settings = {
    getSettings: jest.fn(async () => ({ ENABLE_SIGNUP: 'false' })),
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ...enabled,
      MCP_OAUTH_EXCHANGE_SECRET: 'synthetic-private-secret',
    };
    delete process.env.ALLOWED_CLIENT_CONFIG_VARS;
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  test('includes public OAuth settings without publishing the exchange secret or issuer', async () => {
    const result = await new ConfigService(settings as any).public_config();
    expect(result).toMatchObject({
      MCP_OAUTH_ENABLED: 'true',
      MCP_OAUTH_RESOURCE_URL: 'https://mcp.example.test/tools/mcp',
    });
    expect(result).not.toHaveProperty('MCP_OAUTH_EXCHANGE_SECRET');
    expect(result).not.toHaveProperty('MCP_OAUTH_ISSUER');
    expect(result.ENABLE_SIGNUP).toBe('false');
  });

  test('keeps capability available with a custom client-config allowlist', async () => {
    process.env.ALLOWED_CLIENT_CONFIG_VARS = 'TOOLJET_HOST';
    const result = await new ConfigService(settings as any).public_config();
    expect(result.MCP_OAUTH_ENABLED).toBe('true');
    expect(result.MCP_OAUTH_RESOURCE_URL).toBe('https://mcp.example.test/tools/mcp');
  });

  test('does not let raw allowlisted OAuth flags bypass Cloud-only gating', async () => {
    process.env.TOOLJET_EDITION = 'ee';
    process.env.ALLOWED_CLIENT_CONFIG_VARS = 'MCP_OAUTH_ENABLED,MCP_OAUTH_RESOURCE_URL';
    expect(await new ConfigService(settings as any).public_config()).toMatchObject(disabled);
  });
});
