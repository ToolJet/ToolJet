import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, getDefaultDataSource } from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Repository } from 'typeorm';

/**
 * External API — POST /ext/workspace/:workspaceId/groups (create)
 *                 GET  /ext/workspace/:workspaceId/groups/:groupId (get one)
 *
 * List/patch/delete are covered in test/modules/workflows/e2e/external-api-groups.e2e-spec.ts.
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - create: 201 no body, name validation (length, charset), workspace not found,
 *     applyToAll duplicate rejection, permissions + granularPermissions persisted
 *   - get: 200 shape, workspace not found (404), group not found (404), default group rejected (400)
 */

/** @group platform */
describe('External API — Groups create/get', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;
  let groupRepo: Repository<GroupPermissions>;
  const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
    groupRepo = getDefaultDataSource().getRepository(GroupPermissions);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedOrg() {
    const { organization } = await createUser(app, { email: `groups-${Date.now()}-${Math.random()}@tooljet.io` });
    return organization;
  }

  describe('POST /ext/workspace/:workspaceId/groups', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .send({ name: 'Auditors' })
        .expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', 'Basic wrong-token')
        .send({ name: 'Auditors' })
        .expect(403);
    });

    it('creates a custom group and returns 201 with no body', async () => {
      const org = await seedOrg();
      const res = await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: `Auditors-${Date.now()}` })
        .expect(201);

      expect(res.body).toEqual({});
    });

    it('persists the group with permissions and granularPermissions from the request', async () => {
      const org = await seedOrg();
      const name = `Reviewers-${Date.now()}`;

      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({
          name,
          permissions: { appCreate: true, folderCreate: false },
          granularPermissions: [
            {
              type: 'app',
              applyToAll: true,
              resources: [],
              permissions: { canEdit: false },
            },
          ],
        })
        .expect(201);

      const saved = await groupRepo.findOne({ where: { name, organizationId: org.id } });
      expect(saved).toBeDefined();
      expect(saved.appCreate).toBe(true);

      const getRes = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups/${saved.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);
      expect(getRes.body.granularPermissions).toHaveLength(1);
      expect(getRes.body.granularPermissions[0]).toMatchObject({ type: 'app', applyToAll: true });
    });

    it('returns 400 for a workspace that does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${NONEXISTENT_UUID}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Auditors' })
        .expect(400);
    });

    it('returns 400 when name exceeds 50 characters', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'a'.repeat(51) })
        .expect(400);
    });

    it('returns 400 when name contains disallowed characters', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Bad@Name!' })
        .expect(400);
    });

    it('returns 422 when two applyToAll=true entries are given for the same resource type', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({
          name: `Dup-${Date.now()}`,
          granularPermissions: [
            { type: 'app', applyToAll: true, resources: [], permissions: { canEdit: false } },
            { type: 'app', applyToAll: true, resources: [], permissions: { canEdit: true } },
          ],
        })
        .expect(422);
    });
  });

  describe('GET /ext/workspace/:workspaceId/groups/:groupId', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups/${NONEXISTENT_UUID}`)
        .expect(403);
    });

    it('returns the group with permissions + granularPermissions shape', async () => {
      const org = await seedOrg();
      const name = `Shape-${Date.now()}`;
      await request(app.getHttpServer())
        .post(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .send({ name })
        .expect(201);
      const saved = await groupRepo.findOneOrFail({ where: { name, organizationId: org.id } });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups/${saved.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(res.body).toMatchObject({ id: saved.id, name });
      expect(res.body.permissions).toHaveProperty('apps_create');
      expect(Array.isArray(res.body.granularPermissions)).toBe(true);
    });

    it('returns 404 for a workspace that does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${NONEXISTENT_UUID}/groups/${NONEXISTENT_UUID}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 404 for a group that does not exist in the workspace', async () => {
      const org = await seedOrg();
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups/${NONEXISTENT_UUID}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 400 when the group is a default (role) group, not a custom group', async () => {
      const org = await seedOrg();
      const adminGroup = await groupRepo.findOneOrFail({ where: { name: 'admin', organizationId: org.id } });

      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups/${adminGroup.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });
  });
});
