/**
 * @group platform
 */

/**
 * External API v2 — Users (`api-spec-viewer.html` §1, platform-wide only — the "Workspace
 * Users" sub-resource under §2 is out of scope for this file).
 *
 * Routes under /api/v2/ext/users (EE, gated by FEATURE_KEY.*_USER*_V2, license EXTERNAL_API).
 * Unlike Apps/Modules/Workflows/Folders, this resource is platform-wide, not workspace-scoped —
 * there is no :workspaceIdentifier anywhere in these routes.
 *
 * Known, deliberate spec deviations:
 *   1. Error body shape is NestJS's default AllExceptionsFilter, not the spec's {error:{...}}.
 *   2. Archive/unarchive are symmetric: both the dedicated archive/unarchive endpoints and a
 *      PATCH status change cascade to every OrganizationUser row the user has, not just their
 *      default workspace (a deliberate product decision, not a v1 parity bug).
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, NONEXISTENT_UUID } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const BASE = '/api/v2/ext/users';

describe('ExternalApisUsersControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('should reject requests with no token or an invalid one', async () => {
    await request(app.getHttpServer()).get(BASE).expect(403);
    await request(app.getHttpServer()).get(BASE).set('Authorization', 'Basic wrong-token').expect(403);
  });

  describe('GET /api/v2/ext/users', () => {
    it('should match by search and paginate the results', async () => {
      const suffix = Date.now();
      await createUser(app, { email: `uv2-l1-${suffix}@tooljet.io`, firstName: `Findable${suffix}`, lastName: 'One' });
      await createUser(app, { email: `uv2-l1b-${suffix}@tooljet.io`, firstName: `Findable${suffix}`, lastName: 'Two' });
      await createUser(app, { email: `uv2-l1c-${suffix}@tooljet.io`, firstName: 'Unrelated', lastName: 'Person' });

      const searched = await request(app.getHttpServer())
        .get(`${BASE}?search=findable${suffix}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(2);

      const paged = await request(app.getHttpServer())
        .get(`${BASE}?search=findable${suffix}&page=1&per_page=1`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(1);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 1, total_count: 2 });
    });

    it('should filter by status', async () => {
      const suffix = Date.now();
      const { user } = await createUser(app, {
        email: `uv2-l2-${suffix}@tooljet.io`,
        firstName: `StatusFilter${suffix}`,
      });
      await request(app.getHttpServer())
        .post(`${BASE}/${user.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(200);

      const archived = await request(app.getHttpServer())
        .get(`${BASE}?search=statusfilter${suffix}&status=archived`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(archived.body.data.map((u: { id: string }) => u.id)).toEqual([user.id]);

      const active = await request(app.getHttpServer())
        .get(`${BASE}?search=statusfilter${suffix}&status=active`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(active.body.data).toHaveLength(0);
    });

    it('should reject a per_page above 100', async () => {
      await request(app.getHttpServer()).get(`${BASE}?per_page=101`).set('Authorization', getExtAuth()).expect(400);
    });
  });

  describe('GET /api/v2/ext/users/:userIdentifier', () => {
    it('should resolve by id and by email, and 404 for a nonexistent or malformed identifier', async () => {
      const { user } = await createUser(app, { email: `uv2-g1-${Date.now()}@tooljet.io` });

      const byId = await request(app.getHttpServer())
        .get(`${BASE}/${user.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byId.body).toMatchObject({ id: user.id, email: user.email, status: 'active' });

      const byEmail = await request(app.getHttpServer())
        .get(`${BASE}/${encodeURIComponent(user.email)}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byEmail.body.id).toBe(user.id);

      await request(app.getHttpServer())
        .get(`${BASE}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
      await request(app.getHttpServer())
        .get(`${BASE}/not-a-real-user@tooljet.io`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('PATCH /api/v2/ext/users/:userIdentifier', () => {
    it('should update the name', async () => {
      const { user } = await createUser(app, {
        email: `uv2-u1-${Date.now()}@tooljet.io`,
        firstName: 'Old',
        lastName: 'Name',
      });
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${user.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);
      expect(res.body.name).toBe('New Name');
    });

    it('should archive via status, cascading to every workspace membership', async () => {
      const { user, organization: orgA } = await createUser(app, { email: `uv2-u2-${Date.now()}@tooljet.io` });
      const { organization: orgB } = await createUser(
        app,
        { organizationName: `Second Workspace ${Date.now()}` },
        user
      );

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${user.id}`)
        .set('Authorization', getExtAuth())
        .send({ status: 'archived' })
        .expect(200);
      expect(res.body.status).toBe('archived');

      const workspaces = await request(app.getHttpServer())
        .get(`${BASE}/${user.id}/workspaces`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(workspaces.body.data.map((w: { id: string; status: string }) => [w.id, w.status]).sort()).toEqual(
        [
          [orgA.id, 'archived'],
          [orgB.id, 'archived'],
        ].sort()
      );
    });

    it('should 404 for a nonexistent user', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/users/:userIdentifier/archive and /unarchive', () => {
    it('should archive then unarchive, restoring every workspace membership, and 409 on repeat', async () => {
      const { user, organization: orgA } = await createUser(app, { email: `uv2-a1-${Date.now()}@tooljet.io` });
      const { organization: orgB } = await createUser(
        app,
        { organizationName: `Second Workspace ${Date.now()}` },
        user
      );

      await request(app.getHttpServer())
        .post(`${BASE}/${user.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${BASE}/${user.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(409);

      await request(app.getHttpServer())
        .post(`${BASE}/${user.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${BASE}/${user.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(409);

      const workspaces = await request(app.getHttpServer())
        .get(`${BASE}/${user.id}/workspaces`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(workspaces.body.data.map((w: { id: string; status: string }) => [w.id, w.status]).sort()).toEqual(
        [
          [orgA.id, 'active'],
          [orgB.id, 'active'],
        ].sort()
      );
    });

    it('should 404 for a nonexistent user', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/${NONEXISTENT_UUID}/archive`)
        .set('Authorization', getExtAuth())
        .expect(404);
      await request(app.getHttpServer())
        .post(`${BASE}/${NONEXISTENT_UUID}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('GET /api/v2/ext/users/:userIdentifier/workspaces', () => {
    it('should list every workspace membership regardless of status, and paginate', async () => {
      const { user, organization: orgA } = await createUser(app, { email: `uv2-w1-${Date.now()}@tooljet.io` });
      const { organization: orgB } = await createUser(
        app,
        { organizationName: `Second Workspace ${Date.now()}`, status: 'invited' },
        user
      );

      const res = await request(app.getHttpServer())
        .get(`${BASE}/${user.id}/workspaces`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(2);
      const byId = Object.fromEntries(res.body.data.map((w: { id: string; status: string }) => [w.id, w]));
      expect(byId[orgA.id]).toMatchObject({ status: 'active' });
      expect(byId[orgB.id]).toMatchObject({ status: 'invited' });
      expect(byId[orgA.id]).toHaveProperty('default');
      expect(byId[orgA.id]).toHaveProperty('slug');

      const paged = await request(app.getHttpServer())
        .get(`${BASE}/${user.id}/workspaces?page=1&per_page=1`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(1);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 1, total_count: 2 });
    });

    it('should 404 for a nonexistent user', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/${NONEXISTENT_UUID}/workspaces`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });
});
