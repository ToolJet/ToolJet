import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as supertest from 'supertest';
import { setSecurityHeaders } from '@helpers/bootstrap.helper';

jest.mock('@helpers/utils.helper', () => ({}));

describe('OAuth protocol CORS through bootstrap middleware', () => {
  let app;
  let settings;
  beforeEach(async () => {
    settings = { TOOLJET_HOST: 'https://tooljet.synthetic.example', MCP_OAUTH_ENABLED: 'true', SUB_PATH: '' };
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

  test.each([['false', '/api/mcp-oauth/token'], ['true', '/api/mcp-oauth/connections']])
  ('keeps normal origin restrictions when enabled=%s at %s', async (enabled, path) => {
    settings.MCP_OAUTH_ENABLED = enabled;
    const response = await supertest(app.getHttpServer()).options(path)
      .set('Origin', 'https://client.synthetic.example').set('Access-Control-Request-Method', 'POST');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
