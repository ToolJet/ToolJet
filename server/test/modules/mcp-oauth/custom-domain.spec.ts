import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { McpOAuthService, needsBrowserBootstrap } from '@modules/mcp-oauth/service';
import { hash } from '@modules/mcp-oauth/protocol';

jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));

const organizationId = '00000000-0000-4000-8000-000000000001';
const settings = {
  MCP_OAUTH_ENABLED: 'true',
  ENABLE_CUSTOM_DOMAINS: 'true',
  TOOLJET_HOST: 'https://tooljet.synthetic.example/tools',
  SUB_PATH: '/tools',
  MCP_OAUTH_RESOURCE_URL: 'https://mcp.synthetic.example/mcp',
  MCP_OAUTH_EXCHANGE_SECRET: 'synthetic-service-secret-with-over-32-characters',
};

const makeService = (query: jest.Mock, resolve = jest.fn(async () => ({ organizationId }))) =>
  new McpOAuthService(
    { query, manager: { query }, transaction: async (run) => run({ query }) } as any,
    new ConfigService(settings),
    new JwtService(),
    {} as any,
    { fetchOrganizationDetails: jest.fn() } as any,
    { resolveCustomDomain: resolve } as any,
  );

describe('MCP OAuth custom-domain authority', () => {
  test('reuses a host-only cookie across local ports and bootstraps a different hostname', () => {
    expect(needsBrowserBootstrap('http://localhost:3000/api/mcp-oauth', 'http://localhost:8082')).toBe(false);
    expect(needsBrowserBootstrap('https://tooljet.synthetic.example/api/mcp-oauth', 'https://garden.synthetic.example'))
      .toBe(true);
  });
  test('uses a current active TLS-ready licensed domain and preserves the installation subpath', async () => {
    const query = jest.fn(async () => [{
      id: 'domain-id', domain: 'garden.synthetic.example', updated_at: new Date('2026-10-14T00:00:00Z'),
    }]);
    const oauth = makeService(query);
    await expect(oauth.browserTarget(organizationId)).resolves.toEqual({
      url: 'https://garden.synthetic.example/tools', revision: 'domain-id:garden.synthetic.example',
    });
    await expect(oauth.assertBrowserOrigin(organizationId, 'https://garden.synthetic.example')).resolves.toBeUndefined();
    await expect(oauth.assertBrowserOrigin(organizationId, 'https://other.synthetic.example'))
      .rejects.toMatchObject({ status: 403 });
  });

  test('does not invalidate an interaction for an unrelated timestamp-only domain refresh', async () => {
    let updated_at = new Date('2026-10-14T00:00:00Z');
    const query = jest.fn(async () => [{
      id: 'domain-id', domain: 'garden.synthetic.example', updated_at,
    }]);
    const oauth = makeService(query);
    const first = await oauth.browserTarget(organizationId);
    updated_at = new Date('2026-10-14T00:05:00Z');
    expect(await oauth.browserTarget(organizationId)).toEqual(first);
  });

  test.each([new NotFoundException(), new ForbiddenException()])(
    'falls back to the canonical browser when the domain is removed or loses feature eligibility',
    async (failure) => {
      const query = jest.fn(async () => [{
        id: 'domain-id', domain: 'garden.synthetic.example', updated_at: new Date('2026-10-14T00:00:00Z'),
      }]);
      const oauth = makeService(query, jest.fn(async () => { throw failure; }));
      await expect(oauth.browserTarget(organizationId)).resolves.toEqual({
        url: 'https://tooljet.synthetic.example/tools', revision: 'primary',
      });
      await expect(oauth.assertBrowserOrigin(organizationId, 'https://garden.synthetic.example'))
        .rejects.toMatchObject({ status: 403 });
    },
  );

  test('human-link resolution falls back without making token exchange depend on domain availability', async () => {
    const oauth = makeService(jest.fn(async () => {
      throw new Error('Synthetic domain lookup outage');
    }));
    await expect((oauth as any).browserTargetOrPrimary(organizationId)).resolves.toEqual({
      url: 'https://tooljet.synthetic.example/tools',
      revision: 'primary',
    });
  });

  test('bootstrap is retry-safe for one browser binding and rejects a competing replay', async () => {
    const requestId = 'R'.repeat(43);
    const ticket = 'T'.repeat(43);
    const nonce = 'N'.repeat(43);
    const row: any = {
      id: hash(requestId), kind: 'interaction', client_id: 'client', grant_id: null,
      payload: {
        organizationId,
        primaryOrigin: 'https://tooljet.synthetic.example',
        browserTarget: { url: 'https://garden.synthetic.example/tools', revision: 'domain-id:garden.synthetic.example' },
        bootstrapHash: hash(ticket),
      },
      expires_at: new Date(Date.now() + 60_000), consumed_at: null,
    };
    const query = jest.fn(async (sql: string, values?: any[]) => {
      if (sql.includes('SELECT * FROM mcp_oauth_artifacts')) return [row];
      if (sql.includes('SELECT id,domain')) return [{
        id: 'domain-id', domain: 'garden.synthetic.example', updated_at: new Date('2026-10-14T00:00:00Z'),
      }];
      if (sql.includes('UPDATE mcp_oauth_artifacts SET payload')) {
        row.payload = JSON.parse(values[1]);
        return [];
      }
      return [];
    });
    const oauth = makeService(query);
    const first = await oauth.bootstrapBrowser(requestId, ticket, nonce, 'https://garden.synthetic.example');
    const retry = await oauth.bootstrapBrowser(requestId, ticket, nonce, 'https://garden.synthetic.example');
    expect(retry).toBe(first);
    await expect(oauth.bootstrapBrowser(requestId, ticket, 'X'.repeat(43), 'https://garden.synthetic.example'))
      .rejects.toThrow('already opened');
  });
});
