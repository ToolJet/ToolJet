/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, getDefaultDataSource, NONEXISTENT_UUID } from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE } from 'src/modules/group-permissions/constants';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const WORKSPACES_BASE = '/api/v2/ext/workspaces';

describe('ExternalApisWorkspaceUsersControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  async function createWorkspace() {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const res = await request(app.getHttpServer())
      .post(WORKSPACES_BASE)
      .set('Authorization', getExtAuth())
      .send({ name: `Workspace ${suffix}`, slug: `workspace-${suffix}` })
      .expect(201);
    return { workspaceId: res.body.id as string, suffix };
  }

  it('should reject requests with no token or an invalid one', async () => {
    const { workspaceId } = await createWorkspace();
    await request(app.getHttpServer()).get(`${WORKSPACES_BASE}/${workspaceId}/users`).expect(403);
    await request(app.getHttpServer())
      .get(`${WORKSPACES_BASE}/${workspaceId}/users`)
      .set('Authorization', 'Basic wrong-token')
      .expect(403);
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/users', () => {
    it('should create a brand-new active user with the given role', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: `New User ${suffix}`,
          email: `wu-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        name: `New User ${suffix}`,
        email: `wu-${suffix}@tooljet.io`,
        role: 'end-user',
        status: 'active',
      });
    });

    it('should add an existing platform user to the workspace', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const email = `wu-existing-${suffix}@tooljet.io`;
      await createUser(app, { email, firstName: 'Existing', lastName: 'User' });

      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Existing User', email, password: 'IgnoredPassword1', role: 'builder' })
        .expect(201);
      expect(res.body).toMatchObject({ email, role: 'builder', status: 'active' });
    });

    it('should reject a user who is already a member of the workspace', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const email = `wu-dup-${suffix}@tooljet.io`;
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup User', email, password: 'Password1', role: 'end-user' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup User', email, password: 'Password1', role: 'builder' })
        .expect(409);
    });

    it('should reject an invalid role', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Bad Role',
          email: `wu-badrole-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'superuser',
        })
        .expect(400);
    });

    it('should store optional userDetails metadata', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Meta User',
          email: `wu-meta-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
          userDetails: [{ key: 'department', value: 'engineering' }],
        })
        .expect(201);
      expect(res.body.userDetails).toEqual([{ key: 'department', value: 'engineering' }]);
    });

    it('should 404 for a nonexistent workspace', async () => {
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'X', email: `wu-404-${Date.now()}@tooljet.io`, password: 'Password1', role: 'end-user' })
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/users/bulk', () => {
    it('should create multiple users from a JSON array and report per-entry errors', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
        .set('Authorization', getExtAuth())
        .send({
          users: [
            { name: 'Bulk One', email: `wu-bulk1-${suffix}@tooljet.io`, password: 'Password1', role: 'end-user' },
            { name: 'Bulk Two', email: `wu-bulk2-${suffix}@tooljet.io`, password: 'Password1', role: 'builder' },
            { name: 'Bulk Bad', email: 'not-an-email', password: 'Password1', role: 'end-user' },
          ],
        })
        .expect(207);
      expect(res.body.created).toHaveLength(2);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatchObject({ index: 2, code: 'VALIDATION_ERROR' });
    });

    it('should create users from an uploaded CSV file', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const csv =
        `name,email,password,role\n` +
        `CSV One,wu-csv1-${suffix}@tooljet.io,Password1,end-user\n` +
        `CSV Two,wu-csv2-${suffix}@tooljet.io,Password1,builder\n`;

      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
        .set('Authorization', getExtAuth())
        .attach('file', Buffer.from(csv), 'users.csv')
        .expect(207);
      expect(res.body.created).toHaveLength(2);
      expect(res.body.errors).toHaveLength(0);
    });

    it('should reject an empty batch', async () => {
      const { workspaceId } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
        .set('Authorization', getExtAuth())
        .send({ users: [] })
        .expect(400);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/users', () => {
    it('should match by search, filter by status and role, and paginate', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const first = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: `Findable${suffix} One`,
          email: `wu-list1-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: `Findable${suffix} Two`,
          email: `wu-list2-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'builder',
        })
        .expect(201);

      const searched = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users?search=findable${suffix}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(2);

      const byRole = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users?search=findable${suffix}&role=builder`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byRole.body.data).toHaveLength(1);
      expect(byRole.body.data[0].role).toBe('builder');

      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${first.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);

      const archived = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users?search=findable${suffix}&status=archived`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(archived.body.data.map((u: { id: string }) => u.id)).toEqual([first.body.id]);

      const paged = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users?search=findable${suffix}&page=1&per_page=1`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(1);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 1, total_count: 2 });
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/users/:userIdentifier', () => {
    it('should resolve by id and email, and 404 for a nonexistent one', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const email = `wu-get-${suffix}@tooljet.io`;
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Get Me', email, password: 'Password1', role: 'end-user' })
        .expect(201);

      const byId = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byId.body.id).toBe(created.body.id);

      const byEmail = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${email}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byEmail.body.id).toBe(created.body.id);

      await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should 404 for a user who belongs to a different workspace', async () => {
      const { workspaceId: workspaceA } = await createWorkspace();
      const { workspaceId: workspaceB, suffix } = await createWorkspace();
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceA}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Cross Tenant', email: `wu-cross-${suffix}@tooljet.io`, password: 'Password1', role: 'end-user' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceB}/users/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/users/:userIdentifier', () => {
    it('should update the role, reassigning the default group', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Role Change', email: `wu-role-${suffix}@tooljet.io`, password: 'Password1', role: 'end-user' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ role: 'admin' })
        .expect(200);
      expect(res.body.role).toBe('admin');
    });

    it('should update userDetails metadata', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Meta Change',
          email: `wu-metachange-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ userDetails: [{ key: 'team', value: 'platform' }] })
        .expect(200);
      expect(res.body.userDetails).toEqual([{ key: 'team', value: 'platform' }]);
    });

    it('should 404 for a nonexistent user', async () => {
      const { workspaceId } = await createWorkspace();
      await request(app.getHttpServer())
        .patch(`${WORKSPACES_BASE}/${workspaceId}/users/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ role: 'admin' })
        .expect(404);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/users/bulk', () => {
    it('should update multiple users and report per-entry errors', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const first = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Bulk Update One',
          email: `wu-bu1-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Bulk Update Two',
          email: `wu-bu2-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
        .set('Authorization', getExtAuth())
        .send({
          users: [
            { id: first.body.id, role: 'admin' },
            { id: second.body.id, role: 'builder' },
            { id: NONEXISTENT_UUID, role: 'admin' },
          ],
        })
        .expect(207);
      expect(res.body.updated).toHaveLength(2);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatchObject({ index: 2, code: 'NOT_FOUND' });
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/users/:userIdentifier/archive and /unarchive', () => {
    it('should archive then unarchive a workspace user, and 409 on repeat', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Archive Me',
          email: `wu-archive-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(409);

      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(201);
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });

    it('should 404 for a nonexistent user', async () => {
      const { workspaceId } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${NONEXISTENT_UUID}/archive`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/users/:userIdentifier/groups', () => {
    it('should list only the custom groups the user belongs to', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const created = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Grouped User',
          email: `wu-groups-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      const groupRepo = getDefaultDataSource().getRepository(GroupPermissions);
      const groupUsersRepo = getDefaultDataSource().getRepository(GroupUsers);
      const customGroup = await groupRepo.save(
        groupRepo.create({
          organizationId: workspaceId,
          name: `Auditors ${suffix}`,
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
        })
      );
      await groupUsersRepo.save(groupUsersRepo.create({ userId: created.body.id, groupId: customGroup.id }));

      const res = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${created.body.id}/groups`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.data).toEqual([{ id: customGroup.id, name: `Auditors ${suffix}` }]);
    });

    it('should 404 for a nonexistent user', async () => {
      const { workspaceId } = await createWorkspace();
      await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${NONEXISTENT_UUID}/groups`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });
});
