import * as request from 'supertest';
import * as http from 'http';
import { AddressInfo } from 'net';
import { In } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  ensureAppEnvironments,
  getAllEnvironments,
  createAppWithDependencies,
  login,
  updateEntity,
  findEntities,
} from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceVersion } from 'src/entities/data_source_version.entity';
import { DataSourceVersionOptions } from 'src/entities/data_source_version_options.entity';
import { DatasourceUserTokenData } from 'src/entities/data_source_user_token.entity';

/** @group platform */
describe('DataSourcesController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('POST /api/data-sources | Create data source', () => {
    it('should allow admin to create a data source', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);

      const loggedUser = await login(nestApp, adminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'test_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        name: 'test_data_source',
        kind: 'restapi',
        organizationId: adminUserData.organization.id,
      });
    });

    it('should not allow unauthenticated users to create data sources', async () => {
      const response = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .send({ name: 'test_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/data-sources/:organizationId | List data sources', () => {
    it('should allow admin to list data sources', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);

      const loggedUser = await login(nestApp, adminUserData.user.email);

      // Create a data source via the API so it has the correct organizationId
      await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'list_test_data_source', kind: 'restapi', options: [] });

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/${adminUserData.organization.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.data_sources).toBeDefined();
      expect(Array.isArray(response.body.data_sources)).toBe(true);

      const found = response.body.data_sources.find((ds: any) => ds.name === 'list_test_data_source');
      expect(found).toBeDefined();
    });

    it('should not allow user from another org to list data sources', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

      // Try to list data sources for admin's org using another org's user
      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/${adminUserData.organization.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie);

      // OrganizationValidateGuard rejects cross-org access
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/data-sources/:id | Update data source', () => {
    it('should allow admin to update a data source', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);

      const loggedUser = await login(nestApp, adminUserData.user.email);

      // Create a data source via the API
      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'update_test_data_source', kind: 'restapi', options: [] });

      const dataSourceId = createResponse.body.id;

      // Get default environment for environment_id query param
      const environments = await getAllEnvironments(nestApp, adminUserData.organization.id);
      const defaultEnv = environments.find((e: any) => e.isDefault) || environments[0];

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-sources/${dataSourceId}?environment_id=${defaultEnv.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'updated_data_source_name', options: [] });

      expect(response.statusCode).toBe(200);
    });

    it('should not allow user from another org to update', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      // Note: createAppWithDependencies below creates app which seeds environments
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      // Create data source using createAppWithDependencies, then set organizationId
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: false,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-sources/${dataSource.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie)
        .send({ name: 'hacked_name' });

      // Cross-org access is rejected with a clean 404 (data source not found for
      // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/data-sources/:id | Delete data source', () => {
    it('should allow admin to delete a data source', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);

      const loggedUser = await login(nestApp, adminUserData.user.email);

      // Create a data source via the API
      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'delete_test_data_source', kind: 'restapi', options: [] });

      const dataSourceId = createResponse.body.id;

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-sources/${dataSourceId}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
    });

    it('should not allow user from another org to delete', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      // Note: createAppWithDependencies below creates app which seeds environments
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: false,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-sources/${dataSource.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie);

      // Cross-org access is rejected with a clean 404 (data source not found for
      // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/data-sources/dependent-queries/:id | Dependent query count', () => {
    it('should return the dependent query count for a data source in the same workspace', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: true,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedUser = await login(nestApp, adminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/dependent-queries/${dataSource.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({ datasources: 1, dependent_queries: expect.any(Number) });
    });

    it('should not reveal a data source from another workspace', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: true,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

      // A data source id from another workspace must not be resolvable: the route
      // is guarded by ValidateDataSourceGuard, which 404s when the source does not
      // belong to the caller's workspace. Previously this returned 200 with the
      // existence flag and dependent-query count, leaking cross-tenant metadata.
      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/dependent-queries/${dataSource.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie);

      expect(response.statusCode).toBe(404);
      expect(response.body).not.toHaveProperty('dependent_queries');
    });
  });

  describe('POST /api/data-sources/:id/authorize_oauth2 | OAuth2 authorization', () => {
    it('should not be able to authorize OAuth code for a REST API source if user of another organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: false,
      });

      // Set organizationId on data source so ValidateDataSourceGuard can find it
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedUser = await login(nestApp, anotherOrgAdminUserData.user.email);

      // Should not update if user of another org
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-sources/${dataSource.id}/authorize_oauth2`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({
          code: 'oauth-auth-code',
        });

      // Cross-org access is rejected with a clean 404 (data source not found for
      // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
      expect(response.statusCode).toBe(404);
    });

    describe('token exchange', () => {
      let tokenServer: http.Server;
      let tokenHits: number;
      let tokenUrl: string;
      const savedEnv = { ...process.env };

      beforeAll(async () => {
        tokenServer = http.createServer((req, res) => {
          tokenHits++;
          req.resume();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ access_token: 'access-1', refresh_token: 'refresh-1' }));
        });
        await new Promise<void>((resolve) => tokenServer.listen(0, '127.0.0.1', resolve));
        tokenUrl = `http://127.0.0.1:${(tokenServer.address() as AddressInfo).port}/token`;
      });

      afterAll(() => new Promise<void>((resolve) => tokenServer.close(() => resolve())));

      beforeEach(() => {
        tokenHits = 0;
      });

      afterEach(() => {
        process.env = { ...savedEnv };
      });

      const authorizeRestApiSource = async (email: string, oauthType: string) => {
        const admin = await createUser(nestApp, { email, groups: ['all_users', 'admin'] });
        const [environment] = await ensureAppEnvironments(nestApp, admin.organization.id);
        const session = await login(nestApp, admin.user.email);
        const option = (key: string, value: string, encrypted = false) => ({ key, value, encrypted });

        const created = await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .set('tj-workspace-id', admin.organization.id)
          .set('Cookie', session.tokenCookie)
          .send({
            name: `oauth_source_${oauthType}`,
            kind: 'restapi',
            options: [
              option('auth_type', 'oauth2'),
              option('grant_type', 'authorization_code'),
              option('oauth_type', oauthType),
              option('access_token_url', tokenUrl),
              option('client_id', 'client-a'),
              option('client_secret', 'secret-a', true),
            ],
          })
          .expect(201);

        const response = await request(nestApp.getHttpServer())
          .post(`/api/data-sources/${created.body.id}/authorize_oauth2?environment_id=${environment.id}`)
          .set('tj-workspace-id', admin.organization.id)
          .set('Cookie', session.tokenCookie)
          .send({ code: 'oauth-auth-code' });

        return { response, dataSourceId: created.body.id as string, environmentId: environment.id };
      };

      it('should store the token for a custom OAuth app', async () => {
        const { response, dataSourceId, environmentId } = await authorizeRestApiSource(
          'custom-oauth@tooljet.io',
          'custom_app'
        );

        expect(response.statusCode).toBe(201);
        expect(tokenHits).toBe(1);
        const versions = await findEntities(DataSourceVersion, { where: { dataSourceId } });
        const options = await findEntities(DataSourceVersionOptions, {
          where: { dataSourceVersionId: In(versions.map((version) => version.id)), environmentId },
        });
        const tokens = await findEntities(DatasourceUserTokenData, {
          where: { dataSourceVersionOptionId: In(options.map((option) => option.id)) },
        });
        expect(versions.length).toBeGreaterThan(0);
        expect(tokens).toEqual([expect.objectContaining({ userId: null, refreshToken: expect.any(String) })]);
      });

      it('should refuse a ToolJet managed app on REST API without calling the token URL', async () => {
        const { response } = await authorizeRestApiSource('managed-oauth@tooljet.io', 'tooljet_app');

        expect(response.statusCode).toBe(400);
        expect(tokenHits).toBe(0);
      });

      it('should refuse a loopback token URL when the address check enforces', async () => {
        process.env.SSRF_PROTECTION_ENABLED = 'true';
        process.env.OAUTH_TOKEN_URL_CHECK_MODE = 'enforce';

        const { response } = await authorizeRestApiSource('enforced-oauth@tooljet.io', 'custom_app');

        expect(response.statusCode).toBe(400);
        expect(tokenHits).toBe(0);
      });
    });
  });

  describe('POST /api/data-sources/fetch-oauth2-base-url | OAuth2 URL with workspace constants', () => {
    const MARKER = 'synthetic-victim-marker-7f3a';

    const seedVictimConstant = async () => {
      const victim = await createUser(nestApp, { email: 'victim@tooljet.io', groups: ['all_users', 'admin'] });
      const attacker = await createUser(nestApp, { email: 'attacker@tooljet.io', groups: ['all_users', 'admin'] });
      const victimEnvs = await ensureAppEnvironments(nestApp, victim.organization.id);
      const victimSession = await login(nestApp, victim.user.email);

      await request(nestApp.getHttpServer())
        .post('/api/organization-constants/')
        .set('tj-workspace-id', victim.organization.id)
        .set('Cookie', victimSession.tokenCookie)
        .send({ constant_name: 'OAUTH_MARKER', value: MARKER, type: 'Global', environments: [victimEnvs[0].id] })
        .expect(201);

      return { victim, attacker, victimSession, victimEnvironmentId: victimEnvs[0].id };
    };

    const fetchOauthUrl = (workspaceId: string, cookie: string[], body: Record<string, unknown>) =>
      request(nestApp.getHttpServer())
        .post('/api/data-sources/fetch-oauth2-base-url')
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({
          provider: 'restapi',
          source_options: {
            auth_url: 'https://idp.example/auth',
            client_id: '{{constants.OAUTH_MARKER}}',
            scopes: 'read',
          },
          ...body,
        });

    it('should resolve constants of the caller own workspace', async () => {
      const { victim, victimSession, victimEnvironmentId } = await seedVictimConstant();

      const response = await fetchOauthUrl(victim.organization.id, victimSession.tokenCookie, {
        organization_id: victim.organization.id,
        environment_id: victimEnvironmentId,
      });

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({ url: expect.stringContaining(MARKER) });
    });

    it('should reject with 403 when organization_id names another workspace', async () => {
      const { victim, attacker, victimEnvironmentId } = await seedVictimConstant();
      const attackerSession = await login(nestApp, attacker.user.email);

      const response = await fetchOauthUrl(attacker.organization.id, attackerSession.tokenCookie, {
        organization_id: victim.organization.id,
        environment_id: victimEnvironmentId,
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.stringify(response.body)).not.toContain(MARKER);
    });

    it('should reject with 404 when environment_id belongs to another workspace', async () => {
      const { attacker, victimEnvironmentId } = await seedVictimConstant();
      const attackerSession = await login(nestApp, attacker.user.email);

      const withOwnOrg = await fetchOauthUrl(attacker.organization.id, attackerSession.tokenCookie, {
        organization_id: attacker.organization.id,
        environment_id: victimEnvironmentId,
      });
      const withoutOrg = await fetchOauthUrl(attacker.organization.id, attackerSession.tokenCookie, {
        environment_id: victimEnvironmentId,
      });

      expect(withOwnOrg.statusCode).toBe(404);
      expect(withoutOrg.statusCode).toBe(404);
      expect(JSON.stringify([withOwnOrg.body, withoutOrg.body])).not.toContain(MARKER);
    });
  });
});
