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

  const send = (
    method: 'post' | 'patch',
    path: string,
    cookie: string[],
    body: unknown,
    workspaceId = organizationId
  ) =>
    request(app.getHttpServer())
      [method](`/api/v2/organization-constants${path}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send(body as object);

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

  describe('POST /api/v2/organization-constants | Create a constant', () => {
    const body = (overrides: Record<string, unknown> = {}) => ({
      name: 'new_constant',
      type: 'Global',
      values: [{ environment_id: environments[0].id, value: 'created-value' }],
      ...overrides,
    });

    it('should write the single value to every environment and return the detail', async () => {
      const response = await send('post', '', adminCookie, body()).expect(201);

      expect(response.body).toMatchObject({
        name: 'new_constant',
        type: 'Global',
        owner: { id: adminId, name: 'Ada Lovelace' },
        modified_by: { id: adminId, name: 'Ada Lovelace' },
      });
      expect(response.body.values).toEqual(
        environments.map((env) => ({
          environment_id: env.id,
          environment_name: env.name,
          has_value: true,
          value: 'created-value',
        }))
      );
    });

    it('should never return a Secret value in plaintext', async () => {
      const response = await send(
        'post',
        '',
        adminCookie,
        body({
          name: 'new_secret',
          type: 'Secret',
          values: [{ environment_id: environments[0].id, value: SECRET_PLAINTEXT }],
        })
      ).expect(201);

      expect(response.body.values.map((v: { has_value: boolean }) => v.has_value)).toEqual([true, true, true]);
      expect(JSON.stringify(response.body)).not.toContain(SECRET_PLAINTEXT);
    });

    it('should reject more than one value when the workspace has no multi-environment license', async () => {
      await send(
        'post',
        '',
        adminCookie,
        body({
          values: [
            { environment_id: environments[0].id, value: 'a' },
            { environment_id: environments[1].id, value: 'b' },
          ],
        })
      ).expect(400);
    });

    it('should reject a duplicate name and type with 409', async () => {
      await send('post', '', adminCookie, body({ name: 'api_url' })).expect(409);
    });

    it('should allow the same name with the other type', async () => {
      await send('post', '', adminCookie, body({ name: 'api_url', type: 'Secret' })).expect(201);
    });

    it('should reject an environment that is not in the workspace', async () => {
      await send(
        'post',
        '',
        adminCookie,
        body({ values: [{ environment_id: otherEnvironmentId, value: 'v' }] })
      ).expect(400);
    });

    it('should reject an invalid body', async () => {
      const environment_id = environments[0].id;

      await send('post', '', adminCookie, body({ name: '1bad-name' })).expect(400);
      await send('post', '', adminCookie, body({ name: 'a'.repeat(51) })).expect(400);
      await send('post', '', adminCookie, body({ type: 'Server' })).expect(400);
      await send('post', '', adminCookie, body({ values: [] })).expect(400);
      await send('post', '', adminCookie, body({ values: [{ environment_id: 'not-a-uuid', value: 'v' }] })).expect(400);
      await send('post', '', adminCookie, body({ values: [{ environment_id, value: '' }] })).expect(400);
      await send('post', '', adminCookie, body({ values: [{ environment_id, value: 'x'.repeat(10001) }] })).expect(400);
    });

    it('should reject more than 50 values', async () => {
      const values = Array.from({ length: 51 }, () => ({ environment_id: uuidv4(), value: 'v' }));

      const response = await send('post', '', adminCookie, body({ values })).expect(400);

      expect(response.body.message).toContain('values must contain no more than 50 elements');
    });

    it('should reject users without constant permission', async () => {
      await send('post', '', developerCookie, body()).expect(403);
    });
  });

  describe('PATCH /api/v2/organization-constants/:id | Update values', () => {
    it('should write the single value to every environment and stamp modified_by', async () => {
      const response = await send('patch', `/${apiUrlId}`, adminCookie, {
        values: [{ environment_id: environments[1].id, value: 'https://changed.example.com' }],
      }).expect(200);

      expect(response.body.modified_by).toEqual({ id: adminId, name: 'Ada Lovelace' });
      expect(response.body.values.map((v: { value: string }) => v.value)).toEqual(
        environments.map(() => 'https://changed.example.com')
      );
    });

    it('should keep a Secret value out of the response', async () => {
      const response = await send('patch', `/${dbPasswordId}`, adminCookie, {
        values: [{ environment_id: environments[0].id, value: 'rotated-secret-plaintext' }],
      }).expect(200);

      expect(
        response.body.values.every((v: { has_value: boolean; value: null }) => v.has_value && v.value === null)
      ).toBe(true);
      expect(JSON.stringify(response.body)).not.toContain('rotated-secret-plaintext');
    });

    it('should reject a null value when the workspace has no multi-environment license', async () => {
      await send('patch', `/${apiUrlId}`, adminCookie, {
        values: [{ environment_id: environments[0].id, value: null }],
      }).expect(400);
    });

    it('should reject an environment that is not in the workspace', async () => {
      await send('patch', `/${apiUrlId}`, adminCookie, {
        values: [{ environment_id: otherEnvironmentId, value: 'v' }],
      }).expect(400);
    });

    it('should return 404 for a constant of another workspace and 400 for a malformed id', async () => {
      const values = [{ environment_id: environments[0].id, value: 'v' }];

      await send('patch', `/${otherWorkspaceConstantId}`, adminCookie, { values }).expect(404);
      await send('patch', '/not-a-uuid', adminCookie, { values }).expect(400);
    });

    it('should reject an empty values list', async () => {
      await send('patch', `/${apiUrlId}`, adminCookie, { values: [] }).expect(400);
    });

    it('should reject more than 50 values', async () => {
      const values = Array.from({ length: 51 }, () => ({ environment_id: uuidv4(), value: 'v' }));

      const response = await send('patch', `/${apiUrlId}`, adminCookie, { values }).expect(400);

      expect(response.body.message).toContain('values must contain no more than 50 elements');
    });

    it('should reject users without constant permission', async () => {
      await send('patch', `/${apiUrlId}`, developerCookie, {
        values: [{ environment_id: environments[0].id, value: 'v' }],
      }).expect(403);
    });
  });

  describe('POST /api/v2/organization-constants/bulk-delete | Delete several constants', () => {
    it('should delete the constants of the workspace and skip every other id', async () => {
      const envId = 'env:Global:FROM_ENV';
      const unknownId = uuidv4();
      const ids = [apiUrlId, dbPasswordId, envId, unknownId, otherWorkspaceConstantId, 'not-a-uuid'];

      const response = await send('post', '/bulk-delete', adminCookie, { ids }).expect(200);

      expect(response.body).toEqual({
        deleted_ids: [apiUrlId, dbPasswordId],
        skipped_ids: [envId, unknownId, otherWorkspaceConstantId, 'not-a-uuid'],
      });
      await get(`/${apiUrlId}`, adminCookie).expect(404);
      await get(`/${otherWorkspaceConstantId}`, otherAdminCookie, otherOrganizationId).expect(200);
    });

    it('should reject an invalid body', async () => {
      await send('post', '/bulk-delete', adminCookie, { ids: [] }).expect(400);
      await send('post', '/bulk-delete', adminCookie, { ids: [apiUrlId, apiUrlId] }).expect(400);
      await send('post', '/bulk-delete', adminCookie, { ids: Array.from({ length: 101 }, () => uuidv4()) }).expect(400);
      await send('post', '/bulk-delete', adminCookie, { ids: [1] }).expect(400);
    });

    it('should reject users without constant permission', async () => {
      await send('post', '/bulk-delete', developerCookie, { ids: [apiUrlId] }).expect(403);
    });
  });
});
