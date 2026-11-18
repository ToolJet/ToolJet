import * as request from 'supertest';
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
  findEntity,
  resolveOrSeedDefaultBranch,
  saveEntity,
  getEntityRepository,
} from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceVersion } from 'src/entities/data_source_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';

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

    it("should 404 for another workspace's branch id and create nothing", async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);
      await resolveOrSeedDefaultBranch(adminUserData.organization.id);
      const foreignBranch = await resolveOrSeedDefaultBranch(anotherOrgAdminUserData.organization.id);
      const loggedUser = await login(nestApp, adminUserData.user.email);
      const versionsOnForeignBranch = () =>
        getEntityRepository(DataSourceVersion).count({ where: { branchId: foreignBranch.id } });
      const versionsBefore = await versionsOnForeignBranch();

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-sources?branch_id=${foreignBranch.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'foreign_branch_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(404);
      expect(await findEntity(DataSource, { name: 'foreign_branch_data_source' })).toBeNull();
      expect(await versionsOnForeignBranch()).toBe(versionsBefore);
    });

    it("should create on the caller's own feature branch and without a branch id", async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);
      await resolveOrSeedDefaultBranch(adminUserData.organization.id);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: adminUserData.organization.id,
        name: 'feature',
        isDefault: false,
      } as WorkspaceBranch);
      const loggedUser = await login(nestApp, adminUserData.user.email);

      const onFeature = await request(nestApp.getHttpServer())
        .post(`/api/data-sources?branch_id=${feature.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'feature_branch_data_source', kind: 'restapi', options: [] });
      const withoutBranch = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'no_branch_data_source', kind: 'restapi', options: [] });

      expect(onFeature.statusCode).toBe(201);
      expect(
        await findEntity(DataSourceVersion, { dataSourceId: onFeature.body.id, branchId: feature.id })
      ).toMatchObject({ name: 'feature_branch_data_source', isActive: true });
      expect(withoutBranch.statusCode).toBe(201);
      expect(withoutBranch.body).toMatchObject({ name: 'no_branch_data_source' });
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

    it("should 404 for another workspace's branch id and leave the data source unchanged", async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);
      await resolveOrSeedDefaultBranch(adminUserData.organization.id);
      const foreignBranch = await resolveOrSeedDefaultBranch(anotherOrgAdminUserData.organization.id);
      const loggedUser = await login(nestApp, adminUserData.user.email);
      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'branch_scoped_data_source', kind: 'restapi', options: [] });
      const dataSourceId = createResponse.body.id;
      const environments = await getAllEnvironments(nestApp, adminUserData.organization.id);
      const defaultEnv = environments.find((e: any) => e.isDefault) || environments[0];

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-sources/${dataSourceId}?environment_id=${defaultEnv.id}&branch_id=${foreignBranch.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'renamed_data_source', options: [] });

      expect(response.statusCode).toBe(404);
      expect(await findEntity(DataSource, { id: dataSourceId })).toMatchObject({ name: 'branch_scoped_data_source' });
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

    it('should refuse to delete a static data source', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);
      const loggedUser = await login(nestApp, adminUserData.user.email);
      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'static_data_source', kind: 'restapi', options: [] });
      const dataSourceId = createResponse.body.id;
      await updateEntity(DataSource, dataSourceId, { type: 'static' } as never);

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-sources/${dataSourceId}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(400);
      expect(await findEntity(DataSource, { id: dataSourceId })).not.toBeNull();
    });

    it("should 404 for another workspace's branch id and leave both workspaces unchanged", async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(nestApp, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await ensureAppEnvironments(nestApp, adminUserData.organization.id);
      await resolveOrSeedDefaultBranch(adminUserData.organization.id);
      const foreignBranch = await resolveOrSeedDefaultBranch(anotherOrgAdminUserData.organization.id);
      await updateEntity(WorkspaceBranch, foreignBranch.id, { lastSyncedCommit: 'foreign-commit' });
      const loggedUser = await login(nestApp, adminUserData.user.email);
      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'kept_data_source', kind: 'restapi', options: [] });
      const dataSourceId = createResponse.body.id;

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-sources/${dataSourceId}?branch_id=${foreignBranch.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(404);
      expect(await findEntity(DataSource, { id: dataSourceId })).not.toBeNull();
      expect(await findEntity(WorkspaceBranch, { id: foreignBranch.id })).toMatchObject({
        lastSyncedCommit: 'foreign-commit',
      });
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

  describe('POST /api/data-sources/:id/scope | Change scope', () => {
    it('should set the owner to the converting user when converting an unowned local data source to global', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: false,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedUser = await login(nestApp, adminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-sources/${dataSource.id}/scope`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(201);
      expect(await findEntity(DataSource, { id: dataSource.id })).toMatchObject({
        scope: 'global',
        createdBy: adminUserData.user.id,
      });
    });

    it('should keep the existing owner when converting a data source that already has one', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const otherUserData = await createUser(
        nestApp,
        { email: 'other@tooljet.io', groups: ['all_users', 'admin'], organization: adminUserData.organization },
        undefined
      );
      const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isQueryNeeded: false,
      });
      await updateEntity(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
        createdBy: otherUserData.user.id,
      });

      const loggedUser = await login(nestApp, adminUserData.user.email);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-sources/${dataSource.id}/scope`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(201);
      expect(await findEntity(DataSource, { id: dataSource.id })).toMatchObject({
        scope: 'global',
        createdBy: otherUserData.user.id,
      });
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
