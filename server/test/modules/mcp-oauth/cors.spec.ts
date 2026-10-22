import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as supertest from 'supertest';
import { setSecurityHeaders, setupCsrfOriginCheck } from '@helpers/bootstrap.helper';

jest.mock('@helpers/utils.helper', () => ({}));

describe('OAuth protocol CORS through bootstrap middleware', () => {
  let app;
  let settings;
  beforeEach(async () => {
    settings = { TOOLJET_EDITION: 'cloud', TOOLJET_HOST: 'https://tooljet.synthetic.example', MCP_OAUTH_ENABLED: 'true', SUB_PATH: '' };
    const module = await Test.createTestingModule({
      providers: [{ provide: DataSource, useValue: { query: async () => [] } }],
    }).compile();
    app = module.createNestApplication();
    setSecurityHeaders(app, new ConfigService(settings), { log: jest.fn(), warn: jest.fn(), error: jest.fn() });
    await app.init();
  });
  afterEach(async () => { await app?.close(); });

  test.each(['/api/mcp-oauth/token', '/api/mcp-oauth/revoke', '/tools/api/mcp-oauth/token'])
  ('allows a Basic-auth preflight without browser cookies at %s', async (path) => {
    settings.SUB_PATH = path.startsWith('/tools/') ? '/tools' : '';
    const response = await supertest(app.getHttpServer()).options(path)
      .set('Origin', 'https://client.synthetic.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization, content-type');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain('authorization');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test.each(['ce', 'ee', 'unknown'])('does not open protocol CORS for edition %s', async edition => {
    settings.TOOLJET_EDITION = edition;
    const response = await supertest(app.getHttpServer()).options('/api/mcp-oauth/token')
      .set('Origin', 'https://client.synthetic.example').set('Access-Control-Request-Method', 'POST');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test.each([['false', '/api/mcp-oauth/token'], ['true', '/api/mcp-oauth/connections']])
  ('keeps normal origin restrictions when enabled=%s at %s', async (enabled, path) => {
    settings.MCP_OAUTH_ENABLED = enabled;
    const response = await supertest(app.getHttpServer()).options(path)
      .set('Origin', 'https://client.synthetic.example').set('Access-Control-Request-Method', 'POST');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('SAML callbacks with custom domains and an installation subpath', () => {
  let app;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [{ provide: DataSource, useValue: { query: async () => [] } }],
    }).compile();
    app = module.createNestApplication();
    setupCsrfOriginCheck(app, new ConfigService({
      TOOLJET_HOST: 'https://tooljet.synthetic.example', ENABLE_CUSTOM_DOMAINS: 'true', SUB_PATH: '/tools/',
    }));
    app.use((req, res) => res.status(204).end());
    await app.init();
  });
  afterEach(async () => { await app?.close(); });

  test.each(['/tools/api/sso/saml/synthetic-provider', '/tools/api/oauth/saml/synthetic-provider'])(
    'lets external IdP assertions reach SAML verification at %s', async (path) => {
      await supertest(app.getHttpServer()).post(path)
        .set('Origin', 'https://identity.synthetic.example').type('form')
        .send({ SAMLResponse: 'synthetic-assertion' }).expect(204);
    },
  );

  test.each(['/tools/api/mcp-oauth/interactions/synthetic', '/tools/api/sso/sign-in/synthetic-provider'])(
    'keeps browser origin checks on non-SAML mutations at %s', async (path) => {
      await supertest(app.getHttpServer()).post(path)
        .set('Origin', 'https://identity.synthetic.example').send({}).expect(403);
    },
  );
});

test.each([['cloud', 204], ['ce', 403], ['ee', 403]])(
  'only Cloud exempts public protocol POSTs from browser-origin CSRF checks (%s)', async (edition, status) => {
    const module = await Test.createTestingModule({ providers: [
      { provide: DataSource, useValue: { query: async () => [] } },
    ] }).compile();
    const app = module.createNestApplication();
    setupCsrfOriginCheck(app, new ConfigService({
      TOOLJET_EDITION: edition, MCP_OAUTH_ENABLED: 'true', TOOLJET_HOST: 'https://tooljet.synthetic.example',
      ENABLE_CUSTOM_DOMAINS: 'true', ENABLE_CORS: 'false',
    }));
    app.use((_req, res) => res.status(204).end());
    await app.init();
    try {
      await supertest(app.getHttpServer()).post('/api/mcp-oauth/token')
        .set('Origin', 'https://client.synthetic.example').type('form').send({}).expect(status);
    } finally { await app.close(); }
  },
);
