/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initTestApp,
  closeTestApp,
  createUser,
  getDefaultDataSource,
  findEntity,
  NONEXISTENT_UUID,
  setTestLicenseTerms,
  restoreLicensePlan,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE } from 'src/modules/group-permissions/constants';
import { User } from 'src/entities/user.entity';

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

    it('should add an existing platform user to the workspace, reusing the row and ignoring the supplied password', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const email = `wu-existing-${suffix}@tooljet.io`;
      const { user: existingUser } = await createUser(app, { email, firstName: 'Existing', lastName: 'User' });
      const passwordDigestBefore = (await findEntity(User, { email })).password;

      const res = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Existing User', email, password: 'IgnoredPassword1', role: 'builder' })
        .expect(201);
      expect(res.body).toMatchObject({ id: existingUser.id, email, role: 'builder', status: 'active' });

      const userAfter = await findEntity(User, { email });
      expect(userAfter.id).toBe(existingUser.id);
      expect(userAfter.password).toBe(passwordDigestBefore);
    });

    it('should reject reusing a platform-archived user for a new workspace membership', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const email = `wu-archived-${suffix}@tooljet.io`;
      const { user: existingUser } = await createUser(app, { email, firstName: 'Archived', lastName: 'User' });
      await request(app.getHttpServer())
        .patch(`/api/v2/ext/users/${existingUser.id}`)
        .set('Authorization', getExtAuth())
        .send({ status: 'archived' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Archived User', email, password: 'Password1', role: 'end-user' })
        .expect(400);
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
      expect(
        res.body.created.map((u: { name: string; email: string; role: string }) => [u.name, u.email, u.role])
      ).toEqual([
        ['CSV One', `wu-csv1-${suffix}@tooljet.io`, 'end-user'],
        ['CSV Two', `wu-csv2-${suffix}@tooljet.io`, 'builder'],
      ]);
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

    it('should compensate a role promotion that exceeds the license builder limit mid-batch, reverting both the role and the group membership', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Existing Builder',
          email: `wu-bubuilder-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'builder',
        })
        .expect(201);
      const toPromote = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'To Promote In Bulk',
          email: `wu-bupromote-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      let res;
      try {
        setTestLicenseTerms(app, {
          features: { externalApi: true },
          users: { total: 'UNLIMITED', editor: 1, viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
        } as any);
        res = await request(app.getHttpServer())
          .patch(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
          .set('Authorization', getExtAuth())
          .send({ users: [{ id: toPromote.body.id, role: 'builder' }] })
          .expect(207);
      } finally {
        restoreLicensePlan(app);
      }
      expect(res.body.updated).toHaveLength(0);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0]).toMatchObject({ index: 0, code: 'LICENSE_LIMIT_REACHED' });

      const unchanged = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${toPromote.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unchanged.body.role).toBe('end-user');

      const groupRepo = getDefaultDataSource().getRepository(GroupPermissions);
      const groupUsersRepo = getDefaultDataSource().getRepository(GroupUsers);
      const [endUserGroup, builderGroup] = await Promise.all([
        groupRepo.findOne({ where: { organizationId: workspaceId, name: 'end-user' } }),
        groupRepo.findOne({ where: { organizationId: workspaceId, name: 'builder' } }),
      ]);
      const groupIds = (await groupUsersRepo.find({ where: { userId: toPromote.body.id } })).map((m) => m.groupId);
      expect(groupIds).toContain(endUserGroup.id);
      expect(groupIds).not.toContain(builderGroup.id);
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

  describe('License limits', () => {
    it('should reject creating a workspace user when the license user limit is reached, without persisting anything', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Limit One', email: `wu-limit1-${suffix}@tooljet.io`, password: 'Password1', role: 'end-user' })
        .expect(201);

      const overLimitEmail = `wu-limit2-${suffix}@tooljet.io`;
      try {
        setTestLicenseTerms(app, {
          features: { externalApi: true },
          users: { total: 1, editor: 'UNLIMITED', viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
        } as any);
        await request(app.getHttpServer())
          .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
          .set('Authorization', getExtAuth())
          .send({ name: 'Limit Two', email: overLimitEmail, password: 'Password1', role: 'end-user' })
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }

      expect(await findEntity(User, { email: overLimitEmail })).toBeNull();
    });

    it('should stop creating workspace users once the license limit is reached and report the rest as errors', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const emails = [0, 1, 2, 3].map((i) => `wu-bulklimit${i}-${suffix}@tooljet.io`);

      let res;
      try {
        setTestLicenseTerms(app, {
          features: { externalApi: true },
          users: { total: 2, editor: 'UNLIMITED', viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
        } as any);
        res = await request(app.getHttpServer())
          .post(`${WORKSPACES_BASE}/${workspaceId}/users/bulk`)
          .set('Authorization', getExtAuth())
          .send({
            users: emails.map((email, i) => ({
              name: `Bulk Limit ${i}`,
              email,
              password: 'Password1',
              role: 'end-user',
            })),
          })
          .expect(207);
      } finally {
        restoreLicensePlan(app);
      }

      expect(res.body.created).toHaveLength(2);
      expect(res.body.errors).toHaveLength(2);
      expect(res.body.errors[0]).toMatchObject({ index: 2, code: 'LICENSE_LIMIT_REACHED' });
      expect(res.body.errors[1]).toMatchObject({ index: 3, code: 'LICENSE_LIMIT_REACHED' });
      expect(await findEntity(User, { email: emails[2] })).toBeNull();
      expect(await findEntity(User, { email: emails[3] })).toBeNull();
    });

    it('should reject promoting a workspace user to a role that would exceed the license builder limit, leaving their role unchanged', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Existing Builder',
          email: `wu-builder-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'builder',
        })
        .expect(201);
      const toPromote = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'To Promote',
          email: `wu-promote-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      try {
        setTestLicenseTerms(app, {
          features: { externalApi: true },
          users: { total: 'UNLIMITED', editor: 1, viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
        } as any);
        await request(app.getHttpServer())
          .patch(`${WORKSPACES_BASE}/${workspaceId}/users/${toPromote.body.id}`)
          .set('Authorization', getExtAuth())
          .send({ role: 'builder' })
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }

      const unchanged = await request(app.getHttpServer())
        .get(`${WORKSPACES_BASE}/${workspaceId}/users/${toPromote.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unchanged.body.role).toBe('end-user');

      const groupRepo = getDefaultDataSource().getRepository(GroupPermissions);
      const groupUsersRepo = getDefaultDataSource().getRepository(GroupUsers);
      const [endUserGroup, builderGroup] = await Promise.all([
        groupRepo.findOne({ where: { organizationId: workspaceId, name: 'end-user' } }),
        groupRepo.findOne({ where: { organizationId: workspaceId, name: 'builder' } }),
      ]);
      const groupIds = (await groupUsersRepo.find({ where: { userId: toPromote.body.id } })).map((m) => m.groupId);
      expect(groupIds).toContain(endUserGroup.id);
      expect(groupIds).not.toContain(builderGroup.id);
    });

    it('should reject unarchiving a workspace user when it would exceed the license user limit', async () => {
      const { workspaceId, suffix } = await createWorkspace();
      const toUnarchive = await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'To Unarchive',
          email: `wu-unarchive-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users/${toUnarchive.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);
      await request(app.getHttpServer())
        .post(`${WORKSPACES_BASE}/${workspaceId}/users`)
        .set('Authorization', getExtAuth())
        .send({
          name: 'Occupies The Slot',
          email: `wu-occupies-${suffix}@tooljet.io`,
          password: 'Password1',
          role: 'end-user',
        })
        .expect(201);

      try {
        setTestLicenseTerms(app, {
          features: { externalApi: true },
          users: { total: 1, editor: 'UNLIMITED', viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
        } as any);
        await request(app.getHttpServer())
          .post(`${WORKSPACES_BASE}/${workspaceId}/users/${toUnarchive.body.id}/unarchive`)
          .set('Authorization', getExtAuth())
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }
    });
  });
});

describe('ExternalApisWorkspaceUsersControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /api/v2/ext/workspaces/:workspaceIdentifier/users returns 451 — externalApi not included in starter plan', async () => {
    await request(app.getHttpServer())
      .get(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .expect(451);
  });

  it('POST /api/v2/ext/workspaces/:workspaceIdentifier/users returns 451 — externalApi not included in starter plan', async () => {
    await request(app.getHttpServer())
      .post(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X', email: `wu-starter-${Date.now()}@tooljet.io`, password: 'Password1', role: 'end-user' })
      .expect(451);
  });
});

describe('ExternalApisWorkspaceUsersControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /api/v2/ext/workspaces/:workspaceIdentifier/users returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .get(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/v2/ext/workspaces/:workspaceIdentifier/users returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .post(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X', email: `wu-ce-${Date.now()}@tooljet.io`, password: 'Password1', role: 'end-user' })
      .expect(404);
  });
});
