import { assertPatMintSession, assertPatExchange } from '@modules/personal-access-tokens/credential-lifecycle';
jest.mock('@helpers/utils.helper', () => ({ getTooljetEdition: () => 'cloud' }));
jest.mock('@helpers/bootstrap.helper', () => ({ createLogger: () => ({ log: jest.fn() }) }));
jest.mock('@tooljet/plugins/dist/server', () => ({ QueryError: class extends Error {}, OAuthUnauthorizedClientError: class extends Error {} }), { virtual: true });
import { join } from 'path';
import { LoginConfigsService } from '@modules/login-configs/service';
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';
import { SSOConfigsRepository } from '@modules/login-configs/repository';
import { EncryptionService } from '@modules/encryption/service';
import { RequestContext } from '@modules/request-context/service';
import { SessionUtilService } from '@modules/session/util.service';
import { setConnectionInstance } from '@helpers/database.helper';
import { RevokeMcpOAuthOnInstanceBan1792627200000 } from '../../../migrations/1792627200000-RevokeMcpOAuthOnInstanceBan';
import { ReduceMcpOAuthPolicyContention1792540800000 } from '../../../migrations/1792540800000-ReduceMcpOAuthPolicyContention';
import { McpOAuthIdentityService } from '@modules/mcp-oauth/identity.service';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';
import * as cookieParser from 'cookie-parser';
import { McpOAuthThrottleGuard } from '@modules/mcp-oauth/throttle.guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { McpOAuthController, McpOAuthMetadataController } from '@modules/mcp-oauth/controller';
import { AddMcpOAuth1789416000000 } from '../../../migrations/1789416000000-AddMcpOAuth';
import { AddMcpOAuthRevocationHooks1791290000000 } from '../../../migrations/1791290000000-AddMcpOAuthRevocationHooks';
import { AddMcpOAuthClientAuthentication1791763200000 } from '../../../migrations/1791763200000-AddMcpOAuthClientAuthentication';

jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
import { McpOAuthService } from '@modules/mcp-oauth/service';
import { hash, DELEGATION_AUDIENCE } from '@modules/mcp-oauth/protocol';

const connection = process.env.MCP_OAUTH_TEST_DATABASE_URL;
const databaseTests = connection ? describe : describe.skip;
databaseTests('MCP OAuth with real PostgreSQL and the OAuth engine', () => {
  let db: DataSource;
  let oauth: McpOAuthService;
  let user: any;
  let organizationId: string;
  let client: any;
  let loginPolicy: any;
  const loginConfigs = { fetchOrganizationDetails: async () => loginPolicy };

  const resourceBase = 'https://mcp.synthetic.example/mcp';
  const exchangeSecret = 'synthetic-service-secret-with-over-32-characters';
  const signingSecret = 'synthetic-delegation-signing-secret-for-tests';
  const verifier = 'synthetic-native-verifier-'.repeat(3);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redirectUri = 'http://127.0.0.1:54321/callback';
  const settings = {
    TOOLJET_EDITION: 'cloud',
    MCP_OAUTH_ENABLED: 'true',
    TOOLJET_HOST: 'https://tooljet.synthetic.example',
    MCP_OAUTH_RESOURCE_URL: resourceBase,
    MCP_OAUTH_EXCHANGE_SECRET: exchangeSecret,
    SECRET_KEY_BASE: signingSecret,
  };
  const resource = () => `${resourceBase}/${organizationId}`;
  const request = (overrides = {}) => ({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: resource(),
    state: 'synthetic-state',
    scope: 'apps data',
    ...overrides,
  });
  const approve = async (overrides = {}) => {
    const flow = await oauth.start(request(overrides));
    const response = await oauth.consent(flow.id, flow.csrf, user, true);
    return new URL(response.redirectUrl).searchParams.get('code');
  };
  const redeem = (code, overrides = {}) =>
    oauth.token({
      grant_type: 'authorization_code',
      client_id: client.client_id,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      resource: resource(),
      ...overrides,
    });
  const refresh = (token, overrides = {}) =>
    oauth.token({
      grant_type: 'refresh_token',
      client_id: client.client_id,
      refresh_token: token,
      resource: resource(),
      ...overrides,
    });
  const exchange = (token, overrides = {}, auth = `Bearer ${exchangeSecret}`) =>
    oauth.exchange(
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        subject_token: token,
        resource: resource(),
        ...overrides,
      },
      auth,
    );

  beforeAll(async () => {
    const url = new URL(connection);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !/^\/tooljet_oauth_test_[a-z0-9_]+$/.test(url.pathname)
    ) {
      throw new Error('Use a dedicated local database named tooljet_oauth_test_*');
    }
    db = new DataSource({
      type: 'postgres', url: connection, entities: [join(__dirname, '../../../src/**/*.entity.ts')], synchronize: false, logging: false,
      schema: 'oauth_test', extra: { options: '-c search_path=oauth_test,public' },
    });
    await db.initialize();
    setConnectionInstance(db);
    // npm run test:mcp-oauth applies the real migration chain before Jest starts.
    const [{ total }] = await db.query('SELECT count(*)::int AS total FROM migrations');
    expect(total).toBeGreaterThan(200);
  });
  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query('DROP SCHEMA oauth_test CASCADE');
      await db.destroy();
    }
  });
  beforeEach(async () => {
    await db.query(
      'TRUNCATE mcp_oauth_clients, users, organizations, organization_users, user_sessions, workspace_ban_list, user_ban_list, instance_settings, sso_configs, sso_config_oidc_group_sync, custom_domains CASCADE',
    );
    organizationId = randomUUID();
    user = {
      id: randomUUID(),
      email: 'builder@synthetic.example',
      organizationId,
      sessionId: randomUUID(),
      isPasswordLogin: true,
      isSSOLogin: false,
    };
    await db.query("INSERT INTO users (id,email,status) VALUES ($1,$2,'active')", [user.id, user.email]);
    await db.query("INSERT INTO organizations (id,name,slug,status) VALUES ($1,'Garden operations','garden','active')", [
      organizationId,
    ]);
    await db.query("INSERT INTO organization_users (user_id,organization_id,status,role) VALUES ($1,$2,'active','admin')", [user.id, organizationId]);
    await db.query("INSERT INTO user_sessions(id,user_id,expiry) VALUES ($1,$2,now()+interval '1 day')", [user.sessionId, user.id]);
    const users = { findOne: async () => ({ ...user }), findByEmail: async () => ({ ...user }) };
    loginPolicy = { form: { enabled: true }, openid: { enabled: true, configId: 'synthetic-provider' } };
    oauth = new McpOAuthService(
      db,
      new ConfigService(settings),
      new JwtService(),
      loginConfigs as any,
    );
    Object.assign(oauth, { identity: new McpOAuthIdentityService(db, new ConfigService(settings), new JwtService(), users as any, loginConfigs as any) });
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    client = await oauth.register({
      client_name: 'Synthetic desktop client',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
    });
  });

  const clientRequest = (body, method = client.token_endpoint_auth_method, credential = client.client_secret) =>
    method === 'client_secret_basic'
      ? [body, `Basic ${Buffer.from(`${encodeURIComponent(client.client_id)}:${encodeURIComponent(credential)}`).toString('base64')}`] as const
      : [{ ...body, client_id: client.client_id, ...(method === 'none' ? {} : { client_secret: credential }) }, undefined] as const;
  const codeBody = (code) => ({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirectUri, resource: resource() });
  const refreshBody = (refresh_token) => ({ grant_type: 'refresh_token', refresh_token, resource: resource() });
  const registerConfidential = (method) => oauth.register({
    client_name: 'Synthetic hosted connector', redirect_uris: [redirectUri], token_endpoint_auth_method: method,
  });

  describe('custom-domain transactions', () => {
    const customOrigin = 'https://orchard.synthetic.example';
    let licensed: boolean;
    beforeEach(async () => {
      licensed = true;
      oauth = new McpOAuthService(
        db, new ConfigService({ ...settings, ENABLE_CUSTOM_DOMAINS: 'true' }), new JwtService(),
        loginConfigs as any,
        { resolveCustomDomain: async (domain) => {
          const [row] = await db.query("SELECT organization_id FROM custom_domains WHERE domain=$1 AND status='active' AND ssl_status='active'", [domain]);
          return licensed && row ? { organizationId: row.organization_id } : null;
        } },
      );
      Object.assign(oauth, { identity: new McpOAuthIdentityService(db, new ConfigService({ ...settings, ENABLE_CUSTOM_DOMAINS: 'true' }), new JwtService(), { findOne: async () => ({ ...user }), findByEmail: async () => ({ ...user }) } as any, loginConfigs as any) });
      await db.query("INSERT INTO custom_domains (id,organization_id,domain,status,ssl_status) VALUES ($1,$2,$3,'active','active')", [randomUUID(), organizationId, 'orchard.synthetic.example']);
    });
    const begin = async () => {
      const flow = await oauth.start(request());
      const ticket = new URLSearchParams(new URL(flow.location).hash.slice(1)).get('bootstrap');
      return { ...flow, ticket };
    };

    test('one browser binding wins concurrent bootstrap attempts and a lost-response retry recovers it', async () => {
      const flow = await begin();
      const nonces = ['B'.repeat(43), 'C'.repeat(43)];
      const outcomes = await Promise.allSettled(nonces.map((nonce) => oauth.bootstrapBrowser(flow.id, flow.ticket, nonce, customOrigin)));
      expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const winner = outcomes.findIndex((result) => result.status === 'fulfilled');
      const csrf = (outcomes[winner] as PromiseFulfilledResult<string>).value;
      await expect(oauth.bootstrapBrowser(flow.id, flow.ticket, nonces[winner], customOrigin)).resolves.toBe(csrf);
      const preview = await oauth.preview(flow.id, csrf, customOrigin);
      expect(preview.loginUrl).toContain(`${customOrigin}/login/garden`);
      await expect(oauth.preview(flow.id, flow.csrf, customOrigin)).rejects.toMatchObject({ error: 'invalid_request' });
      await expect(oauth.preview(flow.id, csrf, 'https://other.synthetic.example')).rejects.toMatchObject({ error: 'access_denied' });
      const grants = await Promise.allSettled([
        oauth.consent(flow.id, csrf, user, true, customOrigin),
        oauth.consent(flow.id, csrf, user, true, customOrigin),
      ]);
      expect(grants.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      await expect(oauth.bootstrapBrowser(flow.id, flow.ticket, nonces[winner], customOrigin)).rejects.toMatchObject({ error: 'invalid_request' });
    });

    test.each(['replace', 'remove', 'tls', 'license', 'owner'])('rejects unfinished consent after domain %s changes', async (change) => {
      const flow = await begin();
      const csrf = await oauth.bootstrapBrowser(flow.id, flow.ticket, 'D'.repeat(43), customOrigin);
      if (change === 'replace') await db.query("UPDATE custom_domains SET domain='replacement.synthetic.example'");
      if (change === 'remove') await db.query('DELETE FROM custom_domains');
      if (change === 'tls') await db.query("UPDATE custom_domains SET ssl_status='pending_issuance'");
      if (change === 'license') licensed = false;
      if (change === 'owner') await db.query('UPDATE custom_domains SET organization_id=$1', [(await db.query("INSERT INTO organizations(status) VALUES ('active') RETURNING id"))[0].id]);
      await expect(oauth.preview(flow.id, csrf, customOrigin)).rejects.toThrow('domain changed');
      await expect(oauth.consent(flow.id, csrf, user, true, customOrigin)).rejects.toMatchObject({ error: 'invalid_request' });
      expect(await db.query('SELECT id FROM mcp_oauth_grants')).toEqual([]);
      await expect(oauth.assertBrowserOrigin(organizationId, customOrigin)).rejects.toMatchObject({ error: 'access_denied' });
    });

    test('activation invalidates an unfinished canonical interaction', async () => {
      await db.query("UPDATE custom_domains SET status='pending_verification'");
      const flow = await begin();
      expect(flow.ticket).toBeNull();
      await db.query("UPDATE custom_domains SET status='active'");
      await expect(oauth.preview(flow.id, flow.csrf)).rejects.toThrow('domain changed');
    });

    test('canonical SSO return uses the original issuer cookie for the same custom-domain interaction', async () => {
      const flow = await begin();
      await oauth.bootstrapBrowser(flow.id, flow.ticket, 'E'.repeat(43), customOrigin);
      const preview = await oauth.preview(flow.id, flow.csrf);
      expect(preview.organizationId).toBe(organizationId);
      expect(preview.loginUrl).toContain('https://tooljet.synthetic.example/login/garden');
      const consent = await oauth.consent(flow.id, flow.csrf, user, true);
      const tokens = await redeem(new URL(consent.redirectUrl).searchParams.get('code'));
      expect((await exchange(tokens.access_token)).browser_url).toBe(customOrigin);
      await db.query('DELETE FROM custom_domains');
      const renewed = await refresh(tokens.refresh_token);
      const delegated = await exchange(renewed.access_token);
      expect(delegated.browser_url).toBe('https://tooljet.synthetic.example');
      await oauth.assertBrowserOrigin(organizationId, 'https://tooljet.synthetic.example');
      await oauth.disconnect(user, delegated.grant_id);
      await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    });

    test('expired tickets and wrong origins never establish a custom browser binding', async () => {
      const flow = await begin();
      await expect(oauth.bootstrapBrowser(flow.id, flow.ticket, 'F'.repeat(43), 'https://other.synthetic.example')).rejects.toMatchObject({ error: 'access_denied' });
      await db.query("UPDATE mcp_oauth_artifacts SET expires_at=now()-interval '1 second' WHERE id=$1", [hash(flow.id)]);
      await expect(oauth.bootstrapBrowser(flow.id, flow.ticket, 'F'.repeat(43), customOrigin)).rejects.toThrow('expired');
    });

    test('a concurrent domain replacement cannot slip between consent validation and grant creation', async () => {
      const flow = await begin();
      const csrf = await oauth.bootstrapBrowser(flow.id, flow.ticket, 'G'.repeat(43), customOrigin);
      const writer = db.createQueryRunner();
      await writer.connect();
      await writer.startTransaction();
      let approval: Promise<any>;
      try {
        await writer.query("SET LOCAL statement_timeout = '3s'");
        const [{ pid }] = await writer.query('SELECT pg_backend_pid() AS pid');
        await writer.query('SELECT id FROM custom_domains WHERE organization_id=$1 FOR NO KEY UPDATE', [organizationId]);
        approval = oauth.consent(flow.id, csrf, user, true, customOrigin)
          .then((result) => ({ result }), (error) => ({ error }));
        const deadline = Date.now() + 2000;
        let waiting = false;
        while (!waiting && Date.now() < deadline) {
          const [row] = await db.query('SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))) AS waiting', [pid]);
          waiting = row.waiting;
          if (!waiting) await new Promise((resolve) => setTimeout(resolve, 5));
        }
        expect(waiting).toBe(true);
        await writer.query("UPDATE custom_domains SET domain='replacement.synthetic.example'");
        await writer.commitTransaction();
        expect((await approval).error?.message).toContain('domain changed');
        expect(await db.query('SELECT id FROM mcp_oauth_grants')).toEqual([]);
      } finally {
        if (writer.isTransactionActive) await writer.rollbackTransaction();
        await writer.release();
        await approval;
      }
    }, 10000);
  });

  test('DCR defaults new clients to Basic, stores only the hash, and keeps explicit public clients public', async () => {
    expect(client.token_endpoint_auth_method).toBe('none');
    expect(client.client_secret).toBeUndefined();
    client = await registerConfidential(undefined);
    expect(client.token_endpoint_auth_method).toBe('client_secret_basic');
    expect(client.client_secret).toMatch(/^tj_mcp_secret_[A-Za-z0-9_-]{43}$/);
    expect(client.client_secret_expires_at).toBe(0);
    const [stored] = await db.query('SELECT * FROM mcp_oauth_clients WHERE id=$1', [client.client_id]);
    expect(stored.client_secret_hash).toBe(hash(client.client_secret));
    expect(stored.first_authorized_at).toBeNull();
    expect(JSON.stringify(stored)).not.toContain(client.client_secret);
    const flow = await oauth.start(request());
    const preview = JSON.stringify(await oauth.preview(flow.id, flow.csrf));
    expect(preview).not.toContain(client.client_secret);
    expect(preview).not.toContain(stored.client_secret_hash);
    expect(oauth.metadata().token_endpoint_auth_methods_supported).toEqual(['none', 'client_secret_basic', 'client_secret_post']);
    expect(oauth.metadata().revocation_endpoint_auth_methods_supported).toEqual(['none', 'client_secret_basic', 'client_secret_post']);
    for (const method of [null, '', 'private_key_jwt', ['none']]) {
      await expect(registerConfidential(method)).rejects.toMatchObject({ error: 'invalid_client_metadata' });
    }
  });

  test.each(['client_secret_basic', 'client_secret_post'])('%s code, refresh and revocation require the registered client credentials', async (method) => {
    client = await registerConfidential(method);
    const code = await approve(); // Browser authorization never sends the client secret.
    const body = codeBody(code);
    await expect(oauth.token(...clientRequest(body, 'none'))).rejects.toMatchObject({ error: 'invalid_client' });
    await expect(oauth.token(...clientRequest(body, method, 'synthetic-wrong-secret'))).rejects.toMatchObject({ error: 'invalid_client' });
    const alternate = method === 'client_secret_basic' ? 'client_secret_post' : 'client_secret_basic';
    await expect(oauth.token(...clientRequest(body, alternate))).rejects.toMatchObject({ error: 'invalid_client' });
    const tokens = await oauth.token(...clientRequest(body));
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
    const renewed = await oauth.token(...clientRequest(refreshBody(tokens.refresh_token)));
    await expect(oauth.token(...clientRequest(refreshBody(renewed.refresh_token), method, 'synthetic-wrong-secret'))).rejects.toMatchObject({ error: 'invalid_client' });
    const revocation = { token: renewed.access_token };
    await expect(oauth.revoke(...clientRequest(revocation, 'none'))).rejects.toMatchObject({ error: 'invalid_client' });
    await expect(oauth.revoke(...clientRequest(revocation, method, 'synthetic-wrong-secret'))).rejects.toMatchObject({ error: 'invalid_client' });
    expect((await exchange(renewed.access_token)).access_token).toBeDefined();
    await oauth.revoke(...clientRequest(revocation));
    await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });

  test.each(['code', 'refresh'])('unauthenticated %s replay cannot revoke the valid grant; authenticated replay still does', async (kind) => {
    client = await registerConfidential('client_secret_basic');
    const code = await approve();
    const tokens = await oauth.token(...clientRequest(codeBody(code)));
    const renewed = await oauth.token(...clientRequest(refreshBody(tokens.refresh_token)));
    const replay = kind === 'code' ? codeBody(code) : refreshBody(tokens.refresh_token);
    await expect(oauth.token(...clientRequest(replay, client.token_endpoint_auth_method, 'synthetic-wrong-secret'))).rejects.toMatchObject({ error: 'invalid_client' });
    expect((await exchange(renewed.access_token)).access_token).toBeDefined();
    if (kind === 'refresh') await db.query("UPDATE mcp_oauth_artifacts SET consumed_at=now()-interval '6 seconds' WHERE id=$1", [hash(tokens.refresh_token)]);
    await expect(oauth.token(...clientRequest(replay))).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });

  test('confidential authentication retains PKCE/resource binding and cannot revoke another client', async () => {
    client = await registerConfidential('client_secret_post');
    await expect(oauth.start(request({ code_challenge_method: 'plain' }))).rejects.toMatchObject({ error: 'invalid_request' });
    const code = await approve();
    await expect(oauth.token(...clientRequest({ ...codeBody(code), resource: `${resourceBase}/${randomUUID()}` }))).rejects.toMatchObject({ error: 'invalid_target' });
    // A separately consented code still requires its original verifier even with a valid secret.
    await expect(oauth.token(...clientRequest({ ...codeBody(await approve()), code_verifier: 'synthetic-wrong-verifier-'.repeat(3) }))).rejects.toMatchObject({ error: 'invalid_grant' });
    const tokens = await oauth.token(...clientRequest(codeBody(await approve())));
    client = await registerConfidential('client_secret_post');
    await oauth.revoke(...clientRequest({ token: tokens.access_token }));
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
    await expect(oauth.token(...clientRequest({ grant_type: 'client_credentials', resource: resource() }))).rejects.toMatchObject({ error: 'unsupported_grant_type' });
  });

  test('public clients cannot add credentials to change their registered authentication method', async () => {
    const body = codeBody(await approve());
    for (const method of ['client_secret_basic', 'client_secret_post']) {
      await expect(oauth.token(...clientRequest(body, method, 'synthetic-unregistered-secret'))).rejects.toMatchObject({ error: 'invalid_client' });
    }
    expect((await oauth.token(...clientRequest(body))).access_token).toBeDefined();
  });

  test('client-auth migration preserves existing public registrations and rollback disables confidential clients', async () => {
    const publicId = client.client_id;
    client = await registerConfidential('client_secret_basic');
    const confidentialId = client.client_id;
    await oauth.token(...clientRequest(codeBody(await approve())));
    const runner = db.createQueryRunner();
    const migration = new AddMcpOAuthClientAuthentication1791763200000();
    try {
      await expect(db.query("UPDATE mcp_oauth_clients SET token_endpoint_auth_method='none' WHERE id=$1", [confidentialId])).rejects.toMatchObject({ driverError: { code: '23514', constraint: 'mcp_oauth_client_auth_check' } });
      await expect(db.query("UPDATE mcp_oauth_clients SET client_secret_hash='not-a-hash' WHERE id=$1", [confidentialId])).rejects.toMatchObject({ driverError: { code: '23514', constraint: 'mcp_oauth_client_auth_check' } });
      await new RevokeMcpOAuthOnInstanceBan1792627200000().down(runner);
      await migration.down(runner);
      expect((await db.query('SELECT disabled FROM mcp_oauth_clients WHERE id=$1', [publicId]))[0].disabled).toBe(false);
      expect((await db.query('SELECT disabled FROM mcp_oauth_clients WHERE id=$1', [confidentialId]))[0].disabled).toBe(true);
      expect((await db.query('SELECT revoked_at FROM mcp_oauth_grants'))[0].revoked_at).not.toBeNull();
    } finally {
      await migration.up(runner);
      await new RevokeMcpOAuthOnInstanceBan1792627200000().up(runner);
      await runner.release();
    }
    const [existing] = await db.query('SELECT token_endpoint_auth_method,client_secret_hash,first_authorized_at,created_at FROM mcp_oauth_clients WHERE id=$1', [publicId]);
    expect(existing).toMatchObject({ token_endpoint_auth_method: 'none', client_secret_hash: null });
    expect(existing.first_authorized_at).toEqual(existing.created_at);
    expect((await db.query('SELECT disabled FROM mcp_oauth_clients WHERE id=$1', [confidentialId]))[0].disabled).toBe(true);
  });

  const makeViewer = async (scope = 'apps data') => {
    const tokens = await redeem(await approve({ scope }));
    const delegated = await exchange(tokens.access_token);
    const appId = randomUUID();
    await db.query('INSERT INTO apps (id,organization_id,user_id) VALUES ($1,$2,$3)', [appId, organizationId,user.id]);
    return { tokens, delegated, appId };
  };
  const withCredentialWriteFailure = async (
    table: 'mcp_oauth_grants' | 'user_personal_access_tokens',
    failure: 'missing-table' | 'sql-error',
    operation: () => Promise<void>,
  ) => {
    if (failure === 'missing-table') {
      await db.query(`ALTER TABLE ${table} RENAME TO synthetic_unavailable_credentials`);
    } else {
      await db.query(`CREATE FUNCTION synthetic_reject_credential_update() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Synthetic credential update failure' USING ERRCODE = 'P0001'; END; $$;
        CREATE TRIGGER synthetic_credential_failure BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION synthetic_reject_credential_update();`);
    }
    try {
      await operation();
    } finally {
      if (failure === 'missing-table') {
        await db.query(`ALTER TABLE synthetic_unavailable_credentials RENAME TO ${table}`);
      } else {
        await db.query(`DROP TRIGGER synthetic_credential_failure ON ${table};
          DROP FUNCTION synthetic_reject_credential_update();`);
      }
    }
  };
  describe.each(['missing-table', 'sql-error'] as const)('optional credential revocation failure: %s', failure => {
    test.each(['user', 'workspace', 'membership', 'workspace-ban', 'client', 'sso', 'group-sync', 'instance-policy'])(
      '%s writes commit while failed OAuth revocation still leaves live access checks enforced', async kind => {
        const providerId = randomUUID();
        await db.query("INSERT INTO sso_configs (id,organization_id,sso,enabled,config_scope,configs) VALUES ($1,$2,'openid',true,'organization','{}')", [providerId, organizationId]);
        await db.query('INSERT INTO sso_config_oidc_group_sync (id,sso_config_id,organization_id,claim_name,group_mapping,enable_group_sync) VALUES ($1,$2,$3,$4,$5,true)',
          [randomUUID(), providerId, organizationId, 'teams', JSON.stringify({ archivists: 'operators' })]);
        user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
        const { delegated } = await makeViewer();
        await withCredentialWriteFailure('mcp_oauth_grants', failure, async () => {
          const writes: Record<string, [string, any[]]> = {
            user: ["UPDATE users SET status='archived' WHERE id=$1 RETURNING id", [user.id]],
            workspace: ["UPDATE organizations SET status='archived' WHERE id=$1 RETURNING id", [organizationId]],
            membership: ['DELETE FROM organization_users WHERE user_id=$1 AND organization_id=$2 RETURNING id', [user.id, organizationId]],
            'workspace-ban': ['INSERT INTO workspace_ban_list (organization_id) VALUES ($1) RETURNING id', [organizationId]],
            client: ['UPDATE mcp_oauth_clients SET disabled=true WHERE id=$1 RETURNING id', [client.client_id]],
            sso: ['UPDATE sso_configs SET enabled=false WHERE id=$1 RETURNING id', [providerId]],
            'group-sync': ['UPDATE sso_config_oidc_group_sync SET enable_group_sync=false WHERE sso_config_id=$1 RETURNING id', [providerId]],
            'instance-policy': ["INSERT INTO instance_settings (key,value) VALUES ('MFA_ENABLED','true') RETURNING id", []],
          };
          const [sql, parameters] = writes[kind];
          const result = await db.query(sql, parameters);
          // TypeORM returns [rows, count] for UPDATE/DELETE and rows for INSERT.
          expect(Array.isArray(result[0]) ? result[0] : result).toHaveLength(1);
          await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
        });
      },
    );
    test.each(['mcp_oauth_grants', 'user_personal_access_tokens'] as const)(
      'instance bans commit when %s fails and still invalidate the other credential kind', async table => {
        const { tokens } = await makeViewer();
        await db.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-resilient-ban-pat','workspace',now()+interval '1 day')", [user.id, organizationId]);
        await withCredentialWriteFailure(table, failure, async () => {
          await db.query('INSERT INTO user_ban_list(email) VALUES ($1)', [user.email]);
          expect(await db.query('SELECT email FROM user_ban_list')).toEqual([{ email: user.email }]);
          if (table === 'mcp_oauth_grants') {
            expect((await db.query('SELECT expires_at <= now() AS expired FROM user_personal_access_tokens'))[0].expired).toBe(true);
          } else {
            await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
          }
        });
      },
    );
    test.each(['mcp_oauth_grants', 'user_personal_access_tokens'] as const)(
      'administrative sign-out commits when %s fails and still invalidates the other credential kind', async table => {
        const { tokens } = await makeViewer();
        await db.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-resilient-signout-pat','workspace',now()+interval '1 day')", [user.id, organizationId]);
        await withCredentialWriteFailure(table, failure, async () => {
          await SessionUtilService.prototype.terminateAllSessions.call(
            { configService: new ConfigService({ TOOLJET_EDITION: 'cloud', MCP_OAUTH_ENABLED: 'false' }) }, user.id);
          expect(await db.query('SELECT id FROM user_sessions WHERE user_id=$1', [user.id])).toEqual([]);
          if (table === 'mcp_oauth_grants') {
            expect((await db.query('SELECT expires_at <= now() AS expired FROM user_personal_access_tokens'))[0].expired).toBe(true);
          } else {
            await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
          }
        });
      },
    );
  });
  test('real workspace SSO saves preserve consent for unchanged secrets but revoke rotations', async () => {
    const previousKey = process.env.LOCKBOX_MASTER_KEY;
    process.env.LOCKBOX_MASTER_KEY = '7'.repeat(64);
    const repo = new SSOConfigsRepository(db);
    const encryption = new EncryptionService();
    const util = new LoginConfigsUtilService(new ConfigService(), encryption, {} as any, repo);
    const service = new LoginConfigsService(repo, { findOne: async () => ({ name: 'Garden operations' }) } as any,
      new ConfigService(), encryption, util, {} as any, {} as any);
    const save = (configId, name, clientSecret) => RequestContext.cls.run(new RequestContext({} as any, { locals: {} } as any),
      () => service.updateOrganizationSSOConfigs(user, { type: 'openid', configId, enabled: true,
        configs: { name, clientId: 'synthetic-login-client', clientSecret } }));
    try {
      const row = await save(undefined, 'Garden login', 'synthetic-first-secret');
      user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
      const tokens = await redeem(await approve());
      const renamed = await save(row.id, 'Meadow login', 'synthetic-first-secret');
      expect(renamed.configs.clientSecret).toBe(row.configs.clientSecret);
      await expect(exchange(tokens.access_token)).resolves.toHaveProperty('access_token');
      await save(row.id, 'Meadow login', 'synthetic-first-secret');
      await expect(exchange(tokens.access_token)).resolves.toHaveProperty('access_token');
      const rotated = await save(row.id, 'Meadow login', 'synthetic-second-secret');
      expect(rotated.configs.clientSecret).not.toBe(row.configs.clientSecret);
      await save(row.id, 'Meadow login', 'synthetic-first-secret');
      await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    } finally {
      if (previousKey === undefined) delete process.env.LOCKBOX_MASTER_KEY; else process.env.LOCKBOX_MASTER_KEY = previousKey;
    }
  });
  test.each([false, true])('session termination expires external credentials while preserving an explicitly exempt session: %s', async keepCurrentSession => {
    const { tokens, delegated } = await makeViewer();
    await db.query("INSERT INTO user_sessions(id,user_id,expiry) VALUES ($1,$2,now()+interval '1 day')", [randomUUID(), user.id]);
    await db.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-admin-pat','workspace',now()+interval '1 day')", [user.id,organizationId]);
    // Turning the feature off temporarily must not let a later re-enable revive these credentials.
    await SessionUtilService.prototype.terminateAllSessions.call({ configService: new ConfigService({ TOOLJET_EDITION: 'cloud', MCP_OAUTH_ENABLED: 'false' }) }, user.id, keepCurrentSession ? user.sessionId : undefined);
    expect(await db.query('SELECT id FROM user_sessions WHERE user_id=$1', [user.id])).toEqual(keepCurrentSession ? [{ id: user.sessionId }] : []);
    expect((await db.query('SELECT expires_at <= now() AS expired FROM user_personal_access_tokens'))[0].expired).toBe(true);
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
  });
  const waitForBlockedConnection = async (pid: number) => {
    for (let i = 0; i < 100; i++) {
      const [row] = await db.query('SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))) AS waiting', [pid]);
      if (row.waiting) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Expected credential lifecycle row-lock contention');
  };
  test.each(['termination', 'ban'])('PAT issuance waits for %s and rechecks the initiating session', async reason => {
    const admin = db.createQueryRunner();
    await admin.startTransaction();
    let mint: Promise<unknown>;
    try {
      await admin.query("SELECT pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'))");
      await admin.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE', [user.id]);
      const [{ pid }] = await admin.query('SELECT pg_backend_pid() AS pid');
      mint = db.transaction(async manager => {
        await assertPatMintSession(manager, user);
        await manager.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-racing-pat','workspace',now()+interval '1 day')", [user.id,organizationId]);
      }).then(() => 'unexpected-success', error => error);
      await waitForBlockedConnection(pid);
      await admin.query('DELETE FROM user_sessions WHERE user_id=$1', [user.id]);
      if (reason === 'ban') await admin.query('INSERT INTO user_ban_list(email) VALUES ($1)', [user.email]);
      await admin.commitTransaction();
      expect(await mint).toBeInstanceOf(UnauthorizedException);
      expect(await db.query('SELECT id FROM user_personal_access_tokens')).toEqual([]);
    } finally {
      if (admin.isTransactionActive) await admin.rollbackTransaction();
      await admin.release();
      await mint;
    }
  });
  test('termination waits for an admitted PAT mint and then expires the newly inserted token', async () => {
    const mint = db.createQueryRunner();
    await mint.startTransaction();
    let termination: Promise<unknown>;
    try {
      await assertPatMintSession(mint.manager, user);
      const [{ pid }] = await mint.query('SELECT pg_backend_pid() AS pid');
      termination = SessionUtilService.prototype.terminateAllSessions.call({ configService: new ConfigService({ TOOLJET_EDITION: 'cloud' }) }, user.id);
      await waitForBlockedConnection(pid);
      await mint.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-admitted-pat','workspace',now()+interval '1 day')", [user.id,organizationId]);
      await mint.commitTransaction();
      await termination;
      const [pat] = await db.query('SELECT id, user_id AS "userId", token_hash AS "tokenHash", expires_at <= now() AS expired FROM user_personal_access_tokens');
      expect(pat.expired).toBe(true);
      await expect(db.transaction(manager => assertPatExchange(manager, pat))).rejects.toThrow(UnauthorizedException);
    } finally {
      if (mint.isTransactionActive) await mint.rollbackTransaction();
      await mint.release();
      await termination;
    }
  });
  test('instance ban revokes access, refresh, delegation, viewer and PATs even after unban', async () => {
    const { tokens, delegated, appId } = await makeViewer();
    const viewer = await oauth.viewer(delegated.access_token, organizationId, appId);
    await db.query("INSERT INTO user_personal_access_tokens(user_id,organization_id,token_hash,scope,expires_at) VALUES ($1,$2,'synthetic-pat-hash','workspace',now()+interval '1 day')", [user.id,organizationId]);
    await db.query('INSERT INTO user_ban_list(email) VALUES ($1)', [user.email.toUpperCase()]);
    await db.query('DELETE FROM user_ban_list');
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
    await expect(oauth.authenticateViewer(viewer.access_token)).rejects.toThrow(UnauthorizedException);
    expect((await db.query('SELECT expires_at <= now() AS expired FROM user_personal_access_tokens'))[0].expired).toBe(true);
  });
  test('live ban check denies even when the ban predates a grant', async () => {
    const tokens = await redeem(await approve());
    await db.query('ALTER TABLE user_ban_list DISABLE TRIGGER mcp_oauth_instance_ban_security');
    try { await db.query('INSERT INTO user_ban_list(email) VALUES ($1)', [user.email]); }
    finally { await db.query('ALTER TABLE user_ban_list ENABLE TRIGGER mcp_oauth_instance_ban_security'); }
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await db.query('DELETE FROM user_ban_list');
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('pending registration floods stay bounded and cannot displace an approved client', async () => {
    const tokens = await redeem(await approve());
    await db.query(`INSERT INTO mcp_oauth_clients(id,name,redirect_uris,created_at)
      SELECT 'synthetic-pending-' || i, 'Pending client', '[]', now()-interval '2 minutes' FROM generate_series(1,1000) i`);
    const newcomer = await oauth.register({ client_name: 'New gardener', redirect_uris: [redirectUri], token_endpoint_auth_method: 'none' });
    expect((await db.query('SELECT count(*)::int AS total FROM mcp_oauth_clients WHERE first_authorized_at IS NULL'))[0].total).toBe(1000);
    await expect(exchange(tokens.access_token)).resolves.toHaveProperty('access_token');
    client = newcomer;
    await expect(redeem(await approve())).resolves.toHaveProperty('access_token');
    await db.query("UPDATE mcp_oauth_clients SET created_at=now()-interval '2 hours' WHERE first_authorized_at IS NULL");
    await oauth.register({ client_name: 'Another gardener', redirect_uris: [redirectUri] });
    expect((await db.query('SELECT count(*)::int AS total FROM mcp_oauth_clients WHERE first_authorized_at IS NULL'))[0].total).toBe(1);
  });
  test('approved-client capacity is charged only on first consent and preserves reconnects', async () => {
    await redeem(await approve());
    const approvedClient = client;
    await db.query(`INSERT INTO mcp_oauth_clients(id,name,redirect_uris,first_authorized_at)
      SELECT 'synthetic-approved-' || i, 'Approved client', '[]', now() FROM generate_series(1,9999) i`);
    client = await oauth.register({ client_name: 'Pending gardener', redirect_uris: [redirectUri], token_endpoint_auth_method: 'none' });
    await expect(approve()).rejects.toMatchObject({ error: 'temporarily_unavailable', status: 503 });
    expect((await db.query('SELECT first_authorized_at FROM mcp_oauth_clients WHERE id=$1', [client.client_id]))[0].first_authorized_at).toBeNull();
    client = approvedClient;
    await expect(redeem(await approve())).resolves.toHaveProperty('access_token');
  });
  test('concurrent registrations preserve the shared pending cache bound', async () => {
    await db.query(`INSERT INTO mcp_oauth_clients(id,name,redirect_uris,created_at)
      SELECT 'synthetic-cache-' || i, 'Pending client', '[]', now()-interval '2 minutes' FROM generate_series(1,999) i`);
    await Promise.all(Array.from({ length: 8 }, (_, i) => oauth.register({ client_name: 'Synthetic client '+i, redirect_uris: [redirectUri] })));
    expect((await db.query('SELECT count(*)::int AS total FROM mcp_oauth_clients WHERE first_authorized_at IS NULL'))[0].total).toBe(1000);
  });
  test('rate buckets require credential possession, client authentication and a signed delegation', async () => {
    const { tokens, delegated } = await makeViewer();
    const body = { grant_type: 'refresh_token', client_id: client.client_id, refresh_token: tokens.refresh_token };
    const grant = await oauth.rateLimitGrant('token', body, {});
    expect(grant).toBe(delegated.grant_id);
    expect(await oauth.rateLimitGrant('token', { ...body, refresh_token: 'made-up-token' }, {})).toBeUndefined();
    expect(await oauth.rateLimitGrant('token', { ...body, client_id: 'made-up-client' }, {})).toBeUndefined();
    expect(await oauth.rateLimitGrant('viewer', {}, { 'x-tooljet-delegation': delegated.access_token, 'tj-workspace-id': organizationId })).toBe(grant);
    expect(await oauth.rateLimitGrant('viewer', {}, { 'x-tooljet-delegation': delegated.access_token+'tampered', 'tj-workspace-id': organizationId })).toBeUndefined();
    await db.query('UPDATE mcp_oauth_grants SET revoked_at=now()');
    expect(await oauth.rateLimitGrant('token', body, {})).toBeUndefined();
  });
  test('OAuth viewer is short-lived, app-pinned and cannot become a delegation', async () => {
    const { delegated, appId } = await makeViewer();
    const viewer = await oauth.viewer(delegated.access_token, organizationId, appId);
    expect(viewer.expires_in).toBeLessThanOrEqual(120);
    const principal = await oauth.authenticateViewer(viewer.access_token);
    expect(principal.oauthAppId).toBe(appId);
    expect(principal.isPATLogin).toBe(false);
    await expect(oauth.authenticateDelegation(viewer.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
    await expect(oauth.authenticateViewer(delegated.access_token)).rejects.toThrow(UnauthorizedException);
    await expect(oauth.authenticateViewer(viewer.access_token, randomUUID())).rejects.toThrow(UnauthorizedException);
    await expect(oauth.viewer(viewer.access_token, organizationId, appId)).rejects.toThrow(UnauthorizedException);
  });
  test.each(['sub', 'oauthGrantId', 'oauthTokenId', 'exp'])('rejects a signed delegation missing %s', async (claim) => {
    const { delegated } = await makeViewer();
    const jwt = new JwtService();
    const payload = jwt.decode(delegated.access_token) as Record<string, unknown>;
    delete payload[claim];
    const malformed = jwt.sign(payload, { secret: signingSecret });
    await expect(oauth.authenticateDelegation(malformed, organizationId)).rejects.toThrow(UnauthorizedException);
  });
  test('rejects signed viewer claims with a malformed app identifier', async () => {
    const { delegated, appId } = await makeViewer();
    const viewer = await oauth.viewer(delegated.access_token, organizationId, appId);
    const jwt = new JwtService();
    const payload = jwt.decode(viewer.access_token) as Record<string, unknown>;
    const malformed = jwt.sign({ ...payload, oauthAppId: 'not-a-uuid' }, { secret: signingSecret });
    await expect(oauth.authenticateViewer(malformed)).rejects.toThrow(UnauthorizedException);
  });
  test('viewer mint rejects reduced scope and another workspace app', async () => {
    const limited = await makeViewer('apps');
    await expect(oauth.viewer(limited.delegated.access_token, organizationId, limited.appId)).rejects.toMatchObject({ error: 'access_denied' });
    const complete = await makeViewer();
    await db.query('UPDATE apps SET organization_id=$1 WHERE id=$2', [(await db.query("INSERT INTO organizations(status) VALUES ('active') RETURNING id"))[0].id, complete.appId]);
    await expect(oauth.viewer(complete.delegated.access_token, organizationId, complete.appId)).rejects.toMatchObject({ error: 'access_denied' });
  });
  test.each(['revoke', 'membership', 'access_expiry', 'app_workspace'])('viewer stops immediately after %s', async (reason) => {
    const { tokens, delegated, appId } = await makeViewer();
    const viewer = await oauth.viewer(delegated.access_token, organizationId, appId);
    if (reason === 'revoke') await oauth.revoke({ token: tokens.access_token, client_id: client.client_id });
    if (reason === 'membership') await db.query("UPDATE organization_users SET status='archived'");
    if (reason === 'access_expiry') await db.query("UPDATE mcp_oauth_artifacts SET expires_at=now()-interval '1 second' WHERE kind='access'");
    if (reason === 'app_workspace') await db.query('UPDATE apps SET organization_id=$1 WHERE id=$2', [(await db.query("INSERT INTO organizations(status) VALUES ('active') RETURNING id"))[0].id, appId]);
    await expect(oauth.authenticateViewer(viewer.access_token)).rejects.toThrow(UnauthorizedException);
  });
  test('code+PKCE, delegation, refresh and disconnect work without a PAT', async () => {
    const code = await approve();
    const tokens = await redeem(code);
    expect(tokens.token_type.toLowerCase()).toBe('bearer');
    expect(tokens.expires_in).toBeLessThanOrEqual(600);
    const delegated = await exchange(tokens.access_token);
    const principal = await oauth.authenticateDelegation(delegated.access_token, organizationId);
    expect(principal.oauthScopes).toEqual(['apps', 'data']);
    expect(principal.oauthGrantId).toBe(delegated.grant_id);
    expect(principal.isPATLogin).toBe(false);
    const renewed = await refresh(tokens.refresh_token);
    expect(renewed.refresh_token).not.toBe(tokens.refresh_token);
    const connections = await oauth.connections(user);
    expect(connections).toHaveLength(1);
    await oauth.disconnect(user, connections[0].id);
    await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
    await expect(refresh(renewed.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test.each(['unused', 'denied', 'failed'])('cleanup collects old %s registrations without treating browser attempts as approval', async (attempt) => {
    if (attempt !== 'unused') {
      const flow = await oauth.start(request());
      if (attempt === 'denied') {
        await oauth.consent(flow.id, flow.csrf, user, false);
        await expect(oauth.consent(flow.id, flow.csrf, user, true)).rejects.toMatchObject({ error: 'invalid_request' });
      } else await expect(oauth.consent(flow.id, 'synthetic-wrong-csrf', user, true)).rejects.toMatchObject({ error: 'invalid_request' });
      expect((await db.query('SELECT first_authorized_at FROM mcp_oauth_clients'))[0].first_authorized_at).toBeNull();
      await db.query("UPDATE mcp_oauth_artifacts SET expires_at = now() - interval '1 second'");
    }
    await db.query("UPDATE mcp_oauth_clients SET created_at = now() - interval '25 hours'");
    await oauth.cleanExpiredCredentials();
    expect(await db.query('SELECT id FROM mcp_oauth_clients')).toEqual([]);
  });
  test('cleanup preserves a fresh registration and an old registration with a pending interaction until expiry', async () => {
    await oauth.cleanExpiredCredentials();
    expect(await db.query('SELECT id FROM mcp_oauth_clients')).toEqual([{ id: client.client_id }]);
    await db.query("UPDATE mcp_oauth_clients SET created_at = now() - interval '25 hours'");
    await oauth.start(request());
    await oauth.cleanExpiredCredentials();
    expect((await db.query('SELECT first_authorized_at FROM mcp_oauth_clients'))[0].first_authorized_at).toBeNull();
    await db.query("UPDATE mcp_oauth_artifacts SET expires_at = now() - interval '1 second'");
    await oauth.cleanExpiredCredentials();
    expect(await db.query('SELECT id FROM mcp_oauth_clients')).toEqual([]);
  });
  test('retains client registration after expired grant cleanup so a cached client can reconnect', async () => {
    const expired = await redeem(await approve());
    const firstApproval = (await db.query('SELECT first_authorized_at FROM mcp_oauth_clients'))[0].first_authorized_at;
    expect(firstApproval).toBeInstanceOf(Date);
    await db.query("UPDATE mcp_oauth_clients SET created_at = now() - interval '31 days'");
    await db.query("UPDATE mcp_oauth_grants SET expires_at = now() - interval '1 second'");
    await db.query("UPDATE mcp_oauth_artifacts SET expires_at = now() - interval '1 second'");

    await oauth.cleanExpiredCredentials();

    expect(await db.query('SELECT id FROM mcp_oauth_grants')).toEqual([]);
    expect(await db.query('SELECT id FROM mcp_oauth_artifacts')).toEqual([]);
    expect(await db.query('SELECT id FROM mcp_oauth_clients')).toEqual([{ id: client.client_id }]);
    await expect(exchange(expired.access_token)).rejects.toMatchObject({ error: 'invalid_token' });
    await expect(refresh(expired.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });

    const reconnected = await redeem(await approve());
    expect((await db.query('SELECT first_authorized_at FROM mcp_oauth_clients'))[0].first_authorized_at).toEqual(firstApproval);
    await expect(exchange(reconnected.access_token)).resolves.toHaveProperty('access_token');
    await oauth.revoke({ token: reconnected.refresh_token, client_id: client.client_id });
    await oauth.cleanExpiredCredentials();
    await expect(exchange(reconnected.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(refresh(reconnected.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test.each(['127.0.0.1', '[::1]', 'localhost'])('reuses native registration on a new %s port, preserving the actual callback at exchange', async (host) => {
    const registeredCallback = `http://${host}:52017/callback?channel=desktop`;
    const actualCallback = `http://${host}:43125/callback?channel=desktop`;
    client = await oauth.register({
      client_name: 'Synthetic native reconnect',
      redirect_uris: [registeredCallback],
      token_endpoint_auth_method: 'none',
    });
    const flow = await oauth.start(request({ redirect_uri: actualCallback }));
    const response = await oauth.consent(flow.id, flow.csrf, user, true);
    const callback = new URL(response.redirectUrl);
    expect(callback.origin).toBe(new URL(actualCallback).origin);
    expect(callback.pathname).toBe('/callback');
    expect(callback.searchParams.get('channel')).toBe('desktop');
    const tokens = await redeem(callback.searchParams.get('code'), { redirect_uri: actualCallback });
    expect(tokens.access_token).toMatch(/^tj_oauth_at_/);
    const secondCode = await approve({ redirect_uri: actualCallback });
    await expect(redeem(secondCode, { redirect_uri: registeredCallback })).rejects.toMatchObject({ error: 'invalid_request' });
  });
  test('authorizes the exact Cursor native callback and binds code exchange to it', async () => {
    const native = 'cursor://anysphere.cursor-mcp/oauth/callback';
    const loopback = 'http://localhost:8787/callback';
    client = await oauth.register({
      client_name: 'Synthetic desktop connector',
      redirect_uris: [native, 'https://www.cursor.com/agents/mcp/oauth/callback', loopback],
      token_endpoint_auth_method: 'none',
    });
    const code = await approve({ redirect_uri: native });
    expect((await redeem(code, { redirect_uri: native })).access_token).toMatch(/^tj_oauth_at_/);
    const secondCode = await approve({ redirect_uri: native });
    await expect(redeem(secondCode, { redirect_uri: loopback })).rejects.toMatchObject({ error: 'invalid_request' });
  });
  test('accepts a recent verified login from the exact current workspace SSO provider without a PAT', async () => {
    user.isPasswordLogin = false;
    user.isSSOLogin = true;
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'openid', 'synthetic-provider');
    expect((await redeem(await approve())).access_token).toMatch(/^tj_oauth_at_/);
  });
  test('legacy session flags cannot substitute for exact workspace authentication evidence', async () => {
    user.isSSOLogin = true;
    delete user.workspaceAuthentication;
    await expect(approve()).rejects.toThrow('Sign in to this workspace again');
  });
  test('authentication from a different workspace, provider or old login cannot authorize', async () => {
    const evidence = { ...user.workspaceAuthentication };
    for (const changed of [
      { organizationId: randomUUID() },
      { providerId: 'unverified-provider' },
      { verifiedAt: Math.floor(Date.now() / 1000) - 601 },
      { verifiedAt: Math.floor(Date.now() / 1000) + 60 },
    ]) {
      user.workspaceAuthentication = { ...evidence, ...changed };
      await expect(approve()).rejects.toThrow(UnauthorizedException);
    }
  });
  test('workspace domain and instance restrictions invalidate captured evidence and active grants', async () => {
    const tokens = await redeem(await approve());
    await db.query('UPDATE organizations SET password_allowed_domains = $1 WHERE id = $2', ['synthetic.example', organizationId]);
    await expect(approve()).rejects.toThrow('current workspace login method');
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    const replacement = await redeem(await approve());
    await db.query('INSERT INTO instance_settings (key,value) VALUES ($1,$2)', ['ALLOWED_DOMAINS', 'synthetic.example']);
    await expect(exchange(replacement.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('hidden provider configuration and group-mapping changes invalidate grants', async () => {
    const tokens = await redeem(await approve());
    await db.query("INSERT INTO sso_configs (id,organization_id,sso,enabled,config_scope,configs) VALUES ($1,$2,'openid',true,'organization',$3)", [randomUUID(), organizationId, JSON.stringify({ encryptedSecret: 'synthetic-ciphertext' })]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    const replacement = await redeem(await approve());
    await db.query('INSERT INTO sso_config_oidc_group_sync (id,sso_config_id,organization_id,claim_name,group_mapping,enable_group_sync) VALUES ($1,$2,$3,$4,$5,true)', [randomUUID(), (await db.query('SELECT id FROM sso_configs LIMIT 1'))[0].id, organizationId, 'teams', JSON.stringify({ gardeners: 'operators' })]);
    await expect(exchange(replacement.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test.each(['membership', 'user', 'workspace'])('disable and reenable %s cannot revive consent before any token check', async (target) => {
    const tokens = await redeem(await approve());
    const table = { membership: 'organization_users', user: 'users', workspace: 'organizations' }[target];
    await db.query(`UPDATE ${table} SET status = 'archived'`);
    await db.query(`UPDATE ${table} SET status = 'active'`);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    expect((await db.query('SELECT revoked_at FROM mcp_oauth_grants'))[0].revoked_at).not.toBeNull();
  });
  test('deleting and recreating workspace membership cannot revive consent', async () => {
    const tokens = await redeem(await approve());
    await db.query('DELETE FROM organization_users');
    await db.query("INSERT INTO organization_users (user_id,organization_id,status,role) VALUES ($1,$2,'active','admin')", [user.id, organizationId]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('workspace ban and unban cannot revive a connection', async () => {
    const tokens = await redeem(await approve());
    await db.query('INSERT INTO workspace_ban_list (organization_id) VALUES ($1)', [organizationId]);
    await db.query('DELETE FROM workspace_ban_list');
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('client disable and reenable revokes only the disabled client connections', async () => {
    const originalClient = client;
    const tokens = await redeem(await approve());
    client = await oauth.register({ client_name: 'Other synthetic client', redirect_uris: [redirectUri], token_endpoint_auth_method: 'none' });
    const other = await redeem(await approve());
    await db.query('UPDATE mcp_oauth_clients SET disabled = true WHERE id = $1', [originalClient.client_id]);
    await db.query('UPDATE mcp_oauth_clients SET disabled = false WHERE id = $1', [originalClient.client_id]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    expect((await exchange(other.access_token)).access_token).toBeDefined();
  });
  test('workspace slug change and restore revokes but display-name edits do not', async () => {
    const tokens = await redeem(await approve());
    await db.query('UPDATE organizations SET name = $1', ['Meadow workspace']);
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
    await db.query('UPDATE organizations SET slug = $1', ['meadow']);
    await db.query('UPDATE organizations SET slug = $1', ['garden']);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test.each([['MFA_ENABLED', 'THEME'], ['THEME', 'MFA_ENABLED']])('renaming setting %s to %s and back durably revokes', async (original, changed) => {
    await db.query('INSERT INTO instance_settings (key,value) VALUES ($1,$2)', [original, 'false']);
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    const tokens = await redeem(await approve());
    await db.query('UPDATE instance_settings SET key = $1 WHERE key = $2', [changed, original]);
    await db.query('UPDATE instance_settings SET key = $1 WHERE key = $2', [original, changed]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('unrelated instance settings and other workspaces do not revoke this connection', async () => {
    const tokens = await redeem(await approve());
    await db.query('INSERT INTO instance_settings (key,value) VALUES ($1,$2)', ['THEME', 'dark']);
    await db.query('UPDATE instance_settings SET value = $1', ['light']);
    const [{ id: otherWorkspace }] = await db.query("INSERT INTO organizations(status) VALUES ('active') RETURNING id");
    await db.query('INSERT INTO workspace_ban_list (organization_id) VALUES ($1)', [otherWorkspace]);
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
  });
  test('changing and restoring a workspace restriction revokes before any token check', async () => {
    const tokens = await redeem(await approve());
    await db.query('UPDATE organizations SET domain = $1', ['synthetic.example']);
    await db.query('UPDATE organizations SET domain = NULL');
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('nullable form-login configuration can be disabled and reenabled safely', async () => {
    await db.query("INSERT INTO sso_configs (id,organization_id,sso,enabled,config_scope,configs) VALUES ($1,$2,'form',true,'organization',NULL)", [randomUUID(), organizationId]);
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    const tokens = await redeem(await approve());
    await db.query('UPDATE sso_configs SET enabled = false');
    await db.query('UPDATE sso_configs SET enabled = true');
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('changing and restoring SSO settings revokes while cosmetic names preserve consent', async () => {
    const providerId = randomUUID();
    const original = { name: 'Orchard login', clientId: 'synthetic-client' };
    await db.query("INSERT INTO sso_configs (id,organization_id,sso,enabled,config_scope,configs) VALUES ($1,$2,'openid',true,'organization',$3)", [providerId, organizationId, JSON.stringify(original)]);
    user.workspaceAuthentication = await oauth.captureAuthentication(organizationId, 'form');
    const tokens = await redeem(await approve());
    await db.query('UPDATE sso_configs SET configs = $1', [JSON.stringify({ ...original, name: 'Meadow login' })]);
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
    await db.query('UPDATE sso_configs SET configs = $1', [JSON.stringify({ ...original, clientId: 'changed-client' })]);
    await db.query('UPDATE sso_configs SET configs = $1', [JSON.stringify(original)]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('concurrent client disabling completes without deadlocking first consent or retaining failed approval', async () => {
    const writer = db.createQueryRunner();
    await writer.connect();
    await writer.startTransaction();
    let approval: Promise<{ result?: string; error?: any }>;
    try {
      await writer.query("SET LOCAL statement_timeout = '3s'");
      const [{ pid }] = await writer.query('SELECT pg_backend_pid() AS pid');
      // Model an admin transaction already editing this client; foreign-key reads remain possible.
      await writer.query('SELECT id FROM mcp_oauth_clients WHERE id=$1 FOR NO KEY UPDATE', [client.client_id]);
      approval = approve().then((result) => ({ result }), (error) => ({ error }));
      const deadline = Date.now() + 2000;
      let waiting = false;
      while (!waiting && Date.now() < deadline) {
        const [row] = await db.query('SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))) AS waiting', [pid]);
        waiting = row.waiting;
        if (!waiting) await new Promise((resolve) => setTimeout(resolve, 5));
      }
      expect(waiting).toBe(true);
      await writer.query('UPDATE mcp_oauth_clients SET disabled=true WHERE id=$1', [client.client_id]);
      await writer.commitTransaction();
      const outcome = await approval;
      expect(outcome.error).toMatchObject({ error: 'invalid_grant' });
      expect(outcome.result).toBeUndefined();
      expect((await db.query('SELECT disabled,first_authorized_at FROM mcp_oauth_clients'))[0]).toEqual({ disabled: true, first_authorized_at: null });
      expect(await db.query('SELECT id FROM mcp_oauth_grants')).toEqual([]);
    } finally {
      if (writer.isTransactionActive) await writer.rollbackTransaction();
      await writer.release();
      await approval;
    }
  }, 10000);
  test('a pending security update prevents consent retaining an old-policy grant', async () => {
    const writer = db.createQueryRunner();
    await writer.connect();
    await writer.startTransaction();
    let approval: Promise<string>;
    try {
      await writer.query('UPDATE organizations SET domain = $1', ['new.synthetic.example']);
      approval = approve();
      // Wait for the actual INSERT lock, rather than relying on arbitrary callback timing.
      const deadline = Date.now() + 2000;
      let waiting = false;
      while (!waiting && Date.now() < deadline) {
        const [row] = await db.query("SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND NOT granted AND database = (SELECT oid FROM pg_database WHERE datname = current_database())) AS waiting");
        waiting = row.waiting;
        if (!waiting) await new Promise((resolve) => setTimeout(resolve, 5));
      }
      expect(waiting).toBe(true);
      await writer.commitTransaction();
      await expect(approval).rejects.toThrow('policy changed');
      expect((await db.query('SELECT count(*)::int AS total FROM mcp_oauth_grants'))[0].total).toBe(0);
    } finally {
      if (writer.isTransactionActive) await writer.rollbackTransaction();
      await writer.release();
      await approval?.catch(() => undefined);
    }
  });
  test('observed external policy failure is durably revoked after token transaction rollback', async () => {
    const tokens = await redeem(await approve());
    loginPolicy.form.enabled = false;
    await expect(refresh(tokens.refresh_token)).rejects.toThrow('policy changed');
    loginPolicy.form.enabled = true;
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('observed external policy failure during delegation permanently revokes the connection', async () => {
    const tokens = await redeem(await approve());
    const delegation = await exchange(tokens.access_token);
    loginPolicy.form.enabled = false;
    await expect(oauth.authenticateDelegation(delegation.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
    loginPolicy.form.enabled = true;
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('consent cannot race administrative session termination', async () => {
    const flow = await oauth.start(request());
    const admin = db.createQueryRunner();
    await admin.startTransaction();
    let approval: Promise<unknown>;
    try {
      await admin.query("SELECT pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'))");
      approval = oauth.consent(flow.id, flow.csrf, user, true).then(
        () => { throw new Error('Consent unexpectedly succeeded'); }, error => error);
      // Wait until consent has reached the insertion barrier while the old session is still visible.
      for (let i = 0; i < 100; i++) {
        const [row] = await db.query("SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted AND database=(SELECT oid FROM pg_database WHERE datname=current_database())) AS waiting");
        if (row.waiting) break;
        if (i === 99) throw new Error('Consent did not reach the policy barrier');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      await admin.query('DELETE FROM user_sessions WHERE user_id=$1', [user.id]);
      await admin.commitTransaction();
      expect(await approval).toBeInstanceOf(UnauthorizedException);
      expect(await db.query('SELECT id FROM mcp_oauth_grants WHERE revoked_at IS NULL')).toEqual([]);
    } finally {
      if (admin.isTransactionActive) await admin.rollbackTransaction();
      await admin.release();
      await approval;
    }
  });
  test('tokens and authorization codes are stored only as hashes', async () => {
    const code = await approve();
    const tokens = await redeem(code);
    const rows = JSON.stringify(await db.query('SELECT * FROM mcp_oauth_artifacts'));
    for (const value of [code, tokens.access_token, tokens.refresh_token]) expect(rows).not.toContain(value);
  });
  test('rejects missing/plain PKCE, invalid redirects and wrong resource', async () => {
    for (const [overrides, error] of [
      [{ code_challenge: undefined }, 'invalid_request'],
      [{ code_challenge_method: 'plain' }, 'invalid_request'],
      [{ redirect_uri: 'https://attacker.example/cb' }, 'invalid_client'],
      [{ resource: 'https://attacker.example/mcp/garden' }, 'invalid_target'],
    ]) {
      await expect(oauth.start(request(overrides))).rejects.toMatchObject({ error });
    }
  });
  test('wrong PKCE consumes the authorization code', async () => {
    const code = await approve();
    await expect(redeem(code, { code_verifier: 'wrong-verifier-'.repeat(5) })).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(redeem(code)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('code replay revokes credentials already issued from that grant', async () => {
    const code = await approve();
    const tokens = await redeem(code);
    await expect(redeem(code)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('refresh replay outside the retry window revokes the entire family including derived credentials', async () => {
    const tokens = await redeem(await approve());
    const delegated = await exchange(tokens.access_token);
    const renewed = await refresh(tokens.refresh_token);
    await db.query("UPDATE mcp_oauth_artifacts SET consumed_at=now()-interval '6 seconds' WHERE id=$1", [hash(tokens.refresh_token)]);
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
  });
  test('simultaneous refreshes recover one rotated pair across database connections', async () => {
    const tokens = await redeem(await approve());
    const [first, second] = await Promise.all([refresh(tokens.refresh_token), refresh(tokens.refresh_token)]);
    expect(first.access_token).toBe(second.access_token);
    expect(first.refresh_token).toBe(second.refresh_token);
    expect(first.refresh_token).not.toBe(tokens.refresh_token);
    expect((await exchange(first.access_token)).access_token).toBeDefined();
    const stored = JSON.stringify(await db.query('SELECT payload FROM mcp_oauth_artifacts WHERE id=$1', [hash(tokens.refresh_token)]));
    expect(stored).not.toContain(first.access_token);
    expect(stored).not.toContain(first.refresh_token);
  });
  test.each(['child-used', 'changed-scope', 'invalid-scope', 'tampered-cache'])('refresh retry fails closed for %s', async reason => {
    const tokens = await redeem(await approve());
    const renewed = await refresh(tokens.refresh_token);
    if (reason === 'child-used') await refresh(renewed.refresh_token);
    if (reason === 'tampered-cache') await db.query("UPDATE mcp_oauth_artifacts SET payload=jsonb_set(payload, '{retryResponse}', '\"invalid\"') WHERE id=$1", [hash(tokens.refresh_token)]);
    await expect(refresh(tokens.refresh_token, reason === 'changed-scope' ? { scope: 'apps' } : reason === 'invalid-scope' ? { scope: 'bogus' } : {})).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(exchange(renewed.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('malformed code request does not revoke its grant; a consumed code replay still does', async () => {
    const code = await approve();
    const [{ grant_id: grantId }] = await db.query('SELECT grant_id FROM mcp_oauth_artifacts WHERE id=$1', [hash(code)]);
    await expect(redeem(code, { redirect_uri: 'http://127.0.0.1:54321/wrong' })).rejects.toMatchObject({ error: 'invalid_request' });
    await expect(redeem(code, { code_verifier: 'too-short' })).rejects.toMatchObject({ error: 'invalid_request' });
    expect((await db.query('SELECT revoked_at FROM mcp_oauth_grants WHERE id=$1', [grantId]))[0].revoked_at).toBeNull();
    const tokens = await redeem(code);
    expect((await exchange(tokens.access_token)).access_token).toBeDefined();
    await expect(redeem(code)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('viewer remains usable when the parent access expires, but never after its own grant expires', async () => {
    const { tokens, delegated, appId } = await makeViewer();
    await db.query("UPDATE mcp_oauth_artifacts SET expires_at=now()+interval '20 seconds' WHERE id=$1", [hash(tokens.access_token)]);
    const viewer = await oauth.viewer(delegated.access_token, organizationId, appId);
    expect(viewer.expires_in).toBe(120);
    await db.query("UPDATE mcp_oauth_artifacts SET expires_at=now()-interval '1 second' WHERE id=$1", [hash(tokens.access_token)]);
    expect((await oauth.authenticateViewer(viewer.access_token)).oauthAppId).toBe(appId);
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
    await db.query("UPDATE mcp_oauth_grants SET expires_at=now()-interval '1 second'");
    await expect(oauth.authenticateViewer(viewer.access_token)).rejects.toThrow(UnauthorizedException);
  });
  test('unrelated workspace security changes do not wait on another workspace policy lock', async () => {
    const otherId = randomUUID();
    await db.query("INSERT INTO organizations (id, status) VALUES ($1, 'active')", [otherId]);
    const writer = db.createQueryRunner();
    await writer.startTransaction();
    try {
      await writer.query("UPDATE organizations SET status='archived' WHERE id=$1", [otherId]);
      await db.transaction(async manager => {
        await manager.query("SET LOCAL statement_timeout = '1500ms'");
        await manager.query("UPDATE organizations SET status='archived' WHERE id=$1", [organizationId]);
      });
    } finally { await writer.rollbackTransaction(); await writer.release(); }
  });
  test('crossed membership and instance policy changes do not acquire conflicting advisory locks', async () => {
    const [u1, u2, w1, w2] = Array.from({ length: 4 }, () => randomUUID());
    for (const uid of [u1,u2]) await db.query("INSERT INTO users(id,email,status) VALUES ($1,$2,'active')", [uid, uid+'@synthetic.example']);
    for (const wid of [w1,w2]) await db.query("INSERT INTO organizations(id,status) VALUES ($1,'active')", [wid]);
    for (const uid of [u1, u2]) for (const wid of [w1, w2])
      await db.query("INSERT INTO organization_users (user_id,organization_id,status,role) VALUES ($1, $2, 'active','admin')", [uid, wid]);
    const first = db.createQueryRunner(); const second = db.createQueryRunner();
    await first.startTransaction(); await second.startTransaction();
    try {
      for (const runner of [first, second]) await runner.query("SET LOCAL statement_timeout = '1500ms'");
      const change = (runner, uid, wid) => runner.query(
        "UPDATE organization_users SET status='archived' WHERE user_id=$1 AND organization_id=$2", [uid, wid]);
      await change(first, u1, w1);
      await change(second, u2, w2);
      await Promise.all([change(first, u2, w1), change(second, u1, w2)]);
      // Mixed local/instance edits remain shared lock holders, with no lock upgrades.
      await Promise.all([
        first.query("INSERT INTO instance_settings (key,value) VALUES ('ALLOWED_DOMAINS', 'orchard.example')"),
        second.query("INSERT INTO instance_settings (key,value) VALUES ('PASSWORD_ALLOWED_DOMAINS', 'meadow.example')"),
      ]);
    } finally {
      await first.rollbackTransaction(); await second.rollbackTransaction();
      await first.release(); await second.release();
    }
  });
  test('irrelevant updates skip security trigger execution', async () => {
    await db.transaction(async manager => {
      await manager.query(`CREATE OR REPLACE FUNCTION mcp_oauth_revoke_on_security_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'unexpected trigger'; END; $$`);
      await manager.query("UPDATE users SET email=email");
      await manager.query("UPDATE organizations SET name=name");
      await manager.query("UPDATE mcp_oauth_clients SET name=name");
      // Throw to restore the real function definition after proving the updates skipped it.
      throw new Error('restore function');
    }).catch(error => { expect(error.message).toBe('restore function'); });
  });
  test('checks resource, client and service authentication at exchange', async () => {
    const code = await approve();
    await expect(redeem(code, { client_id: 'another-client' })).rejects.toMatchObject({ error: 'invalid_client' });
    await expect(redeem(code, { resource: `${resourceBase}/other-workspace` })).rejects.toMatchObject({ error: 'invalid_target' });
    const tokens = await redeem(code);
    await expect(exchange(tokens.access_token, {}, 'Bearer wrong-service-key')).rejects.toMatchObject({ error: 'invalid_client', status: 401 });
    await expect(
      exchange(tokens.access_token, { resource: `${resourceBase}/other-workspace` }),
    ).rejects.toMatchObject({ error: 'invalid_target' });
    const delegated = await exchange(tokens.access_token);
    await expect(oauth.authenticateDelegation(delegated.access_token, randomUUID())).rejects.toThrow(UnauthorizedException);
  });
  test('checks fixed access expiry and JWT audience rather than sliding browser expiry', async () => {
    const tokens = await redeem(await approve());
    const delegated = await exchange(tokens.access_token);
    const payload: any = new JwtService().decode(delegated.access_token);
    expect(payload.aud).toBe(DELEGATION_AUDIENCE);
    const wrongAudience = new JwtService().sign(
      { ...payload, aud: 'different-resource' },
      { secret: signingSecret },
    );
    await expect(oauth.authenticateDelegation(wrongAudience, organizationId)).rejects.toThrow(UnauthorizedException);
    await db.query("UPDATE mcp_oauth_artifacts SET expires_at = now() - interval '1 second' WHERE id = $1", [
      hash(tokens.access_token),
    ]);
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_token' });
    await expect(oauth.authenticateDelegation(delegated.access_token, organizationId)).rejects.toThrow(UnauthorizedException);
  });
  test.each(['membership', 'user', 'workspace', 'client', 'suspension'])(
    'denies access after %s removal',
    async (kind) => {
      const tokens = await redeem(await approve());
      if (kind === 'membership') await db.query("UPDATE organization_users SET status='archived'");
      if (kind === 'user') await db.query("UPDATE users SET status='archived'");
      if (kind === 'workspace') await db.query("UPDATE organizations SET status='archived'");
      if (kind === 'client') await db.query('UPDATE mcp_oauth_clients SET disabled=true');
      if (kind === 'suspension')
        await db.query('INSERT INTO workspace_ban_list (organization_id) VALUES ($1)', [organizationId]);
      await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
      // Client authentication precedes grant validation during refresh.
      await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({
        error: kind === 'client' ? 'invalid_client' : 'invalid_grant',
      });
    },
  );
  test('requires browser-bound consent and refuses PAT/delegated consent', async () => {
    const flow = await oauth.start(request());
    await expect(oauth.consent(flow.id, 'wrong-browser', user, true)).rejects.toMatchObject({ error: 'invalid_request' });
    await expect(oauth.consent(flow.id, flow.csrf, { ...user, isPATLogin: true }, true)).rejects.toThrow(UnauthorizedException);
    await expect(
      oauth.consent(flow.id, flow.csrf, { ...user, oauthGrantId: randomUUID() }, true),
    ).rejects.toThrow(UnauthorizedException);
    const denied = await oauth.consent(flow.id, flow.csrf, user, false);
    expect(new URL(denied.redirectUrl).searchParams.get('error')).toBe('access_denied');
    await expect(oauth.consent(flow.id, flow.csrf, user, true)).rejects.toMatchObject({ error: 'invalid_request' });
  });
  test('refresh cannot widen scopes and another user cannot disconnect the grant', async () => {
    const tokens = await redeem(await approve({ scope: 'apps' }));
    await expect(refresh(tokens.refresh_token, { scope: 'apps workspace_users' })).rejects.toMatchObject({ error: 'invalid_scope' });
    const delegated = await exchange(tokens.access_token);
    await oauth.disconnect({ ...user, id: randomUUID() }, delegated.grant_id);
    expect((await exchange(tokens.access_token)).grant_id).toBe(delegated.grant_id);
    await oauth.revoke({ token: tokens.refresh_token, client_id: client.client_id });
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('a changed workspace SSO policy invalidates existing grants', async () => {
    const tokens = await redeem(await approve());
    loginPolicy.openid.enabled = false;
    await expect(exchange(tokens.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });
    await expect(refresh(tokens.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' });
  });
  test('cannot consent with password authentication after password login is disabled', async () => {
    loginPolicy.form.enabled = false;
    await expect(approve()).rejects.toThrow(UnauthorizedException);
  });
  test('HTTP discovery, browser consent and form-encoded token endpoints interoperate', async () => {
    const module = await Test.createTestingModule({
      controllers: [McpOAuthController, McpOAuthMetadataController],
      providers: [{ provide: McpOAuthService, useValue: oauth }],
    })
      .overrideGuard(McpOAuthThrottleGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = user;
          return true;
        },
      })
      .compile();
    const app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api', { exclude: ['.well-known/{*path}'] });
    await app.init();
    try {
      const http = supertest(app.getHttpServer());
      const metadata = await http.get('/.well-known/oauth-authorization-server/api/mcp-oauth').expect(200);
      expect(metadata.body.issuer).toBe('https://tooljet.synthetic.example/api/mcp-oauth');
      for (const [changes, error] of [[{ code_challenge: '' }, 'invalid_request'], [{ scope: 'unsupported' }, 'invalid_scope'], [{ resource: resourceBase + '/missing' }, 'invalid_target']] as const) {
        const failed = await http.get('/api/mcp-oauth/authorize').query(request(changes)).expect(302);
        const location = new URL(failed.headers.location);
        expect(location.origin + location.pathname).toBe(redirectUri);
        expect(location.searchParams.get('error')).toBe(error);
        expect(location.searchParams.get('state')).toBe('synthetic-state');
        expect(location.searchParams.get('iss')).toBe(metadata.body.issuer);
        expect(failed.headers['set-cookie']).toBeUndefined();
      }
      const invalidClient = await http.get('/api/mcp-oauth/authorize').query(request({ redirect_uri: 'https://unregistered.synthetic.example/callback' })).expect(400);
      expect(invalidClient.headers.location).toBeUndefined();
      const authorization = await http.get('/api/mcp-oauth/authorize').query(request()).expect(302);
      const id = new URL(authorization.headers.location).searchParams.get('request');
      const cookies = authorization.headers['set-cookie'].map((cookie) => cookie.split(';')[0]);
      const preview = await http.get(`/api/mcp-oauth/interactions/${id}`).set('Cookie', cookies).expect(200);
      const headers = {
        Cookie: cookies,
        'tj-workspace-id': organizationId,
        'x-tooljet-oauth-csrf': preview.body.csrfToken,
      };
      await http.post(`/api/mcp-oauth/interactions/${id}`).set(headers).send({ allow: true }).expect(403);
      const approved = await http
        .post(`/api/mcp-oauth/interactions/${id}`)
        .set(headers)
        .set('Origin', 'https://tooljet.synthetic.example')
        .send({ allow: true })
        .expect(200);
      const redirect = new URL(approved.body.redirectUrl);
      expect(redirect.searchParams.get('state')).toBe('synthetic-state');
      expect(redirect.searchParams.get('iss')).toBe(metadata.body.issuer);
      const token = await http
        .post('/api/mcp-oauth/token')
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: client.client_id,
          code: redirect.searchParams.get('code'),
          code_verifier: verifier,
          redirect_uri: redirectUri,
          resource: resource(),
        })
        .expect(200);
      expect(token.body.access_token).toMatch(/^tj_oauth_at_/);
      expect(token.headers['cache-control']).toBe('no-store');
      for (const path of ['/api/mcp-oauth/exchange', '/api/mcp-oauth/exchange/']) {
        const wrongService = await http.post(path)
          .set('Authorization', 'Bearer synthetic-mismatched-service-key')
          .send({ subject_token: token.body.access_token }).expect(401);
        expect(wrongService.body.error).toBe('invalid_client');
        expect(wrongService.headers['www-authenticate']).toBeUndefined();
      }
      const connections = await http.get('/api/mcp-oauth/connections').expect(200);
      expect(connections.body).toEqual([{
        id: expect.any(String), client_name: 'Synthetic desktop client', scopes: ['apps', 'data'],
        created_at: expect.any(String), expires_at: expect.any(String),
      }]);
      for (const key of ['created_at', 'expires_at']) {
        expect(new Date(connections.body[0][key]).toISOString()).toBe(connections.body[0][key]);
      }
      client = (await http.post('/api/mcp-oauth/register').send({ client_name: 'Synthetic confidential HTTP client', redirect_uris: [redirectUri] }).expect(201)).body;
      const code = await approve();
      const [body, authorizationHeader] = clientRequest(codeBody(code));
      const invalid = await http.post('/api/mcp-oauth/token').type('form').set('Authorization', 'Basic c3ludGhldGljOndyb25n').send(body).expect(401);
      expect(invalid.body.error).toBe('invalid_client');
      expect(invalid.headers['www-authenticate']).toBe('Basic realm="ToolJet MCP OAuth"');
      await http.post('/api/mcp-oauth/token').type('form').set('Authorization', authorizationHeader).send({ ...body, client_id: client.client_id }).expect(400);
      const confidential = await http.post('/api/mcp-oauth/token').type('form').set('Authorization', authorizationHeader).send(body).expect(200);
      const rejected = await http.post('/api/mcp-oauth/revoke').type('form').set('Authorization', 'Basic c3ludGhldGljOndyb25n').send({ token: confidential.body.access_token }).expect(401);
      expect(rejected.headers['www-authenticate']).toBe('Basic realm="ToolJet MCP OAuth"');
      expect((await exchange(confidential.body.access_token)).access_token).toBeDefined();
      await http.post('/api/mcp-oauth/revoke').type('form').set('Authorization', authorizationHeader).send({ token: confidential.body.access_token }).expect(200);
      await expect(exchange(confidential.body.access_token)).rejects.toMatchObject({ error: 'invalid_grant' });

    } finally {
      await app.close();
    }
  });
  test('Cloud OAuth is disabled unless explicitly enabled', async () => {
    const disabled = new McpOAuthService(
      db,
      new ConfigService({ ...settings, MCP_OAUTH_ENABLED: 'false' }),
      new JwtService(),
      loginConfigs as any,
    );
    expect(() => disabled.metadata()).toThrow(NotFoundException);
    expect(oauth.metadata().code_challenge_methods_supported).toEqual(['S256']);
  });
});
