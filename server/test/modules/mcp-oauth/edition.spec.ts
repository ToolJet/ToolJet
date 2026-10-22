jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { McpOAuthThrottleGuard } from '@modules/mcp-oauth/throttle.guard';
import * as supertest from 'supertest';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { McpOAuthService } from '@modules/mcp-oauth/service';
import { McpOAuthIdentityService } from '@modules/mcp-oauth/identity.service';
import { McpOAuthController, McpOAuthMetadataController } from '@modules/mcp-oauth/controller';
import { isMcpOAuthEnabled } from '@modules/mcp-oauth/http-security';
import { parseOAuthSettings } from '@modules/mcp-oauth/parsers';

const settings = {
  TOOLJET_EDITION: 'cloud', MCP_OAUTH_ENABLED: 'true',
  TOOLJET_HOST: 'https://tooljet.synthetic.example',
  MCP_OAUTH_RESOURCE_URL: 'https://mcp.synthetic.example/mcp',
  MCP_OAUTH_EXCHANGE_SECRET: 'synthetic-service-secret-with-over-32-characters',
};
const config = (values) => ({ get: (key) => values[key] }) as ConfigService;

test.each(['ce', 'ee', 'unknown', '', undefined])('edition %s fails closed even with the flag enabled', edition => {
  expect(isMcpOAuthEnabled(edition, 'true')).toBe(false);
  expect(() => parseOAuthSettings(config({ ...settings, TOOLJET_EDITION: edition }))).toThrow('Not Found');
});
test.each(['cloud', 'Cloud', 'CLOUD'])('%s requires the explicit flag and valid deployment settings', edition => {
  const cloudSettings = { ...settings, TOOLJET_EDITION: edition };
  expect(parseOAuthSettings(config(cloudSettings)).issuer).toBe('https://tooljet.synthetic.example/api/mcp-oauth');
  expect(() => parseOAuthSettings(config({ ...cloudSettings, MCP_OAUTH_ENABLED: 'false' }))).toThrow('Not Found');
  expect(() => parseOAuthSettings(config({ ...cloudSettings, MCP_OAUTH_RESOURCE_URL: undefined }))).toThrow('requires');
});

test.each([{ edition: 'ce', enabled: 'true' }, { edition: 'ee', enabled: 'true' }, { edition: 'cloud', enabled: 'false' }])('edition $edition enabled=$enabled exposes no OAuth routes or background work', async ({ edition, enabled }) => {
  const values = { ...settings, TOOLJET_EDITION: edition, MCP_OAUTH_ENABLED: enabled };
  const db = { query: jest.fn(), transaction: jest.fn(), manager: { query: jest.fn() } };
  const login = { fetchOrganizationDetails: jest.fn() };
  const oauth = new McpOAuthService(db as any, config(values), new JwtService(), login as any);
  Object.assign(oauth, { identity: new McpOAuthIdentityService(db as any, config(values), new JwtService(), {} as any, login as any) });
  const module = await Test.createTestingModule({
    controllers: [McpOAuthController, McpOAuthMetadataController],
    providers: [{ provide: McpOAuthService, useValue: oauth }],
  }).overrideGuard(McpOAuthThrottleGuard).useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: context => {
      context.switchToHttp().getRequest().user = { id: 'synthetic-user', organizationId: 'synthetic-workspace' };
      return true;
    } }).compile();
  const app = module.createNestApplication();
  app.setGlobalPrefix('api', { exclude: ['.well-known/{*path}'] });
  await app.init();
  try {
    const http = supertest(app.getHttpServer());
    for (const path of ['/.well-known/oauth-authorization-server/api/mcp-oauth', '/api/mcp-oauth/authorize',
      '/api/mcp-oauth/interactions/synthetic', '/api/mcp-oauth/interactions/synthetic/session', '/api/mcp-oauth/connections']) {
      await http.get(path).expect(404);
    }
    for (const path of ['register', 'exchange', 'viewer', 'interactions/synthetic/bootstrap',
      'interactions/synthetic', 'connections/synthetic/revoke']) {
      await http.post('/api/mcp-oauth/' + path).set('Origin', settings.TOOLJET_HOST).set('x-tooljet-oauth', '1')
        .send({ allow: true, ticket: 'synthetic-ticket', nonce: 'synthetic-nonce' }).expect(404);
    }
    for (const path of ['token', 'revoke']) {
      await http.post('/api/mcp-oauth/' + path).type('form').send({ token: 'synthetic-token' }).expect(404);
      await http.options('/api/mcp-oauth/' + path).expect(404);
    }
    await expect(oauth.captureAuthentication('synthetic-workspace', 'form')).resolves.toBeUndefined();
    await oauth.cleanExpiredCredentials();
    expect(db.query).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
    expect(db.manager.query).not.toHaveBeenCalled();
    expect(login.fetchOrganizationDetails).not.toHaveBeenCalled();
    // The same registered controllers remain functional when configured for Cloud.
    values.TOOLJET_EDITION = 'cloud';
    values.MCP_OAUTH_ENABLED = 'true';
    await http.get('/.well-known/oauth-authorization-server/api/mcp-oauth').expect(200);
  } finally { await app.close(); }
});
