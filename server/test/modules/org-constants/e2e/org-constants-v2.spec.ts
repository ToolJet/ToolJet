import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  login,
  ensureAppEnvironments,
  findEntityOrFail,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';

const SECRET_PLAINTEXT = 'super-secret-plaintext-value';
const GLOBAL_PLAINTEXT = 'https://api.example.com';

/** @group platform */
describe('OrgConstantsControllerV2', () => {
  let app: INestApplication;
  let adminCookie: string[];
  let developerCookie: string[];
  let viewerCookie: string[];
  let otherAdminCookie: string[];
  let organizationId: string;
  let otherOrganizationId: string;
  let adminId: string;
  let developerId: string;
  let environments: { id: string; name: string; priority: number }[];
  let otherEnvironmentId: string;
  let apiUrlId: string;
  let dbPasswordId: string;
  let otherWorkspaceConstantId: string;

  const get = (path: string, cookie: string[], workspaceId = organizationId) =>
    request(app.getHttpServer())
      .get(`/api/v2/organization-constants${path}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie);

  const createConstant = async (cookie: string[], workspaceId: string, body: Record<string, unknown>) => {
    const response = await request(app.getHttpServer())
      .post('/api/organization-constants/')
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    return response.body.constant.id as string;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp());

    const admin = await createUser(app, {
      email: 'admin@tooljet.io',
      firstName: 'Ada',
      lastName: 'Lovelace',
      groups: ['admin', 'all_users'],
    });
    const developer = await createUser(app, {
      email: 'developer@tooljet.io',
      firstName: 'Grace',
      lastName: 'Hopper',
      groups: ['developer', 'all_users'],
      organization: admin.organization,
    });
    await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['viewer', 'all_users'],
      organization: admin.organization,
    });
    const otherAdmin = await createUser(app, { email: 'other-admin@tooljet.io', groups: ['admin', 'all_users'] });

    organizationId = admin.user.organizationId;
    otherOrganizationId = otherAdmin.user.organizationId;
    adminId = admin.user.id;
    developerId = developer.user.id;

    environments = (await ensureAppEnvironments(app, organizationId)).sort((a, b) => a.priority - b.priority);
    otherEnvironmentId = (await ensureAppEnvironments(app, otherOrganizationId))[0].id;

    adminCookie = (await login(app)).tokenCookie;
    developerCookie = (await login(app, 'developer@tooljet.io')).tokenCookie;
    viewerCookie = (await login(app, 'viewer@tooljet.io')).tokenCookie;
    otherAdminCookie = (await login(app, 'other-admin@tooljet.io')).tokenCookie;

    const environmentIds = environments.map((env) => env.id);
    apiUrlId = await createConstant(adminCookie, organizationId, {
      constant_name: 'api_url',
      value: GLOBAL_PLAINTEXT,
      type: 'Global',
      environments: environmentIds,
    });
    dbPasswordId = await createConstant(adminCookie, organizationId, {
      constant_name: 'db_password',
      value: SECRET_PLAINTEXT,
      type: 'Secret',
      environments: environmentIds,
    });
    const devOnlyId = await createConstant(adminCookie, organizationId, {
      constant_name: 'dev_only',
      value: 'only-in-development',
      type: 'Global',
      environments: environmentIds,
    });
    otherWorkspaceConstantId = await createConstant(otherAdminCookie, otherOrganizationId, {
      constant_name: 'foreign',
      value: 'foreign-value',
      type: 'Global',
      environments: [otherEnvironmentId],
    });

    // The creation API fills every environment on this plan, so unset staging and production by hand.
    await getDefaultDataSource().query(
      `UPDATE org_environment_constant_values SET value = '' WHERE organization_constant_id = $1 AND environment_id <> $2`,
      [devOnlyId, environmentIds[0]]
    );
    await updateEntity(OrganizationConstant, apiUrlId, { updatedBy: developerId });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/v2/organization-constants | List constants', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/api/v2/organization-constants').expect(401);
    });

    it('should reject users without constant permission', async () => {
      const query = () => `?environment_id=${environments[0].id}&type=Global`;

      await get(query(), developerCookie).expect(403);
      await get(query(), viewerCookie).expect(403);
    });

    it('should list Global constants of the environment in the documented shape', async () => {
      const response = await get(`?environment_id=${environments[0].id}&type=Global`, adminCookie).expect(200);

      expect(response.body).toMatchObject({
        page: 1,
        page_size: 50,
        total: 2,
        counts: { secrets: 1, globals: 2 },
      });
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).toMatchObject({
        kind: 'constant',
        id: apiUrlId,
        name: 'api_url',
        type: 'Global',
        source: 'workspace',
        value: GLOBAL_PLAINTEXT,
        environments_with_value: expect.arrayContaining(environments.map((env) => env.id)),
        last_modified_at: expect.any(String),
        owner: { id: adminId, name: 'Ada Lovelace' },
        modified_by: { id: developerId, name: 'Grace Hopper' },
        actions: { edit: true, delete: true },
      });
    });

    it('should return a null value for Secrets and never include their plaintext', async () => {
      const secrets = await get(`?environment_id=${environments[0].id}&type=Secret`, adminCookie).expect(200);
      const globals = await get(`?environment_id=${environments[0].id}&type=Global`, adminCookie).expect(200);

      expect(secrets.body.items).toEqual([
        expect.objectContaining({ id: dbPasswordId, name: 'db_password', type: 'Secret', value: null }),
      ]);
      expect(JSON.stringify(secrets.body)).not.toContain(SECRET_PLAINTEXT);
      expect(JSON.stringify(globals.body)).not.toContain(SECRET_PLAINTEXT);
    });

    it('should leave out constants with no value in the selected environment', async () => {
      const response = await get(`?environment_id=${environments[1].id}&type=Global`, adminCookie).expect(200);

      expect(response.body.items.map((item: { name: string }) => item.name)).toEqual(['api_url']);
      expect(response.body).toMatchObject({ total: 1, counts: { secrets: 1, globals: 1 } });
    });

    it('should make the counts follow the search', async () => {
      const response = await get(`?environment_id=${environments[0].id}&type=Global&search=DEV`, adminCookie).expect(
        200
      );

      expect(response.body.items.map((item: { name: string }) => item.name)).toEqual(['dev_only']);
      expect(response.body).toMatchObject({ total: 1, counts: { secrets: 0, globals: 1 } });
    });

    it('should reject an environment that is not in the workspace', async () => {
      await get(`?environment_id=${uuidv4()}&type=Global`, adminCookie).expect(400);
      await get(`?environment_id=${otherEnvironmentId}&type=Global`, adminCookie).expect(400);
    });

    it('should reject an invalid query', async () => {
      const base = `environment_id=${environments[0].id}&type=Global`;

      await get(`?${base}&sort=newest`, adminCookie).expect(400);
      await get(`?${base}&source=workspace,bogus`, adminCookie).expect(400);
      await get(`?${base}&per_page=101`, adminCookie).expect(400);
      await get(`?environment_id=${environments[0].id}`, adminCookie).expect(400);
    });
  });

  describe('GET /api/v2/organization-constants/:id | Get one constant', () => {
    it('should return the value of every environment for a Global, ordered by priority', async () => {
      const response = await get(`/${apiUrlId}`, adminCookie).expect(200);

      expect(response.body).toMatchObject({
        id: apiUrlId,
        name: 'api_url',
        type: 'Global',
        owner: { id: adminId, name: 'Ada Lovelace' },
        modified_by: { id: developerId, name: 'Grace Hopper' },
        last_modified_at: expect.any(String),
        created_at: expect.any(String),
      });
      expect(response.body.values).toEqual(
        environments.map((env) => ({
          environment_id: env.id,
          environment_name: env.name,
          has_value: true,
          value: GLOBAL_PLAINTEXT,
        }))
      );
    });

    it('should report has_value true and a null value for every environment of a Secret', async () => {
      const response = await get(`/${dbPasswordId}`, adminCookie).expect(200);

      expect(response.body.values).toEqual(
        environments.map((env) => ({
          environment_id: env.id,
          environment_name: env.name,
          has_value: true,
          value: null,
        }))
      );
      expect(JSON.stringify(response.body)).not.toContain(SECRET_PLAINTEXT);
    });

    it('should report has_value false for an environment with no value', async () => {
      const devOnly = (await findEntityOrFail(OrganizationConstant, { constantName: 'dev_only', organizationId })).id;

      const response = await get(`/${devOnly}`, adminCookie).expect(200);

      expect(response.body.values.map((v: { has_value: boolean }) => v.has_value)).toEqual([true, false, false]);
      expect(response.body.values[1]).toMatchObject({ value: null });
    });

    it('should reject users without constant permission', async () => {
      await get(`/${apiUrlId}`, developerCookie).expect(403);
    });

    it('should return 404 for a constant of another workspace', async () => {
      await get(`/${otherWorkspaceConstantId}`, adminCookie).expect(404);
    });

    it('should return 400 for an id that is not a UUID', async () => {
      await get('/not-a-uuid', adminCookie).expect(400);
    });
  });
});
