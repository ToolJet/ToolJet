/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp } from 'test-helper';

jest.setTimeout(120_000);

describe('ExternalApisController — user metadata', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let getExtAuth: () => string;

    // Workspace + member shared across all metadata tests
    let orgId: string;
    let memberId: string;
    let memberEmail: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const token = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
      getExtAuth = () => `Basic ${token}`;

      // Admin creates the workspace
      const { user: admin } = await createUser(app, { email: 'metadata-admin@tooljet.io' });
      orgId = admin.defaultOrganizationId;

      // Member created via ext API so they have real org membership + OrganizationUser row
      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Metadata Member',
          email: 'metadata-member@example.com',
          workspaces: [{ id: orgId, status: 'active' }],
        });

      memberId = res.body.id;
      memberEmail = 'metadata-member@example.com';
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    // ─── PUT ────────────────────────────────────────────────────────────────

    describe('PUT /api/ext/workspace/:workspaceId/user/:userId | Update user metadata', () => {
      it('should return 403 when Authorization header is missing', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .send({ userDetails: [{ key: 'role', value: 'admin' }] })
          .expect(403);
      });

      it('should store key-value metadata and return it in the response', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({
            userDetails: [
              { key: 'department', value: 'engineering' },
              { key: 'tier', value: 'gold' },
            ],
          })
          .expect(200);

        expect(res.body).toMatchObject({
          id: memberId,
          email: memberEmail,
          status: expect.any(String),
          userDetails: expect.arrayContaining([
            { key: 'department', value: 'engineering' },
            { key: 'tier', value: 'gold' },
          ]),
        });
      });

      it('should accept email as userId', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberEmail}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'lookup', value: 'by-email' }] })
          .expect(200);

        expect(res.body).toMatchObject({
          id: memberId,
          userDetails: expect.arrayContaining([{ key: 'lookup', value: 'by-email' }]),
        });
      });

      it('should overwrite previous metadata on a subsequent PUT', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'plan', value: 'starter' }] })
          .expect(200);

        const res = await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'plan', value: 'enterprise' }] })
          .expect(200);

        expect(res.body.userDetails).toEqual(expect.arrayContaining([{ key: 'plan', value: 'enterprise' }]));
        expect(res.body.userDetails.find((d: { key: string }) => d.key === 'plan').value).toBe('enterprise');
      });

      it('should accept an empty userDetails array and succeed', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [] })
          .expect(200);

        expect(res.body).toMatchObject({ id: memberId, userDetails: [] });
      });

      it('should return 400 when userDetails field is missing from request body', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ unexpectedField: 'value' })
          .expect(400);
      });

      it('should return 400 when userDetails contains entries missing key or value', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'missing-value' }] })
          .expect(400);
      });

      it('should return 403 when Authorization token is invalid', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', 'Basic invalidtoken')
          .send({ userDetails: [{ key: 'k', value: 'v' }] })
          .expect(403);
      });

      it('should return 404 when workspaceId does not exist', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/00000000-0000-0000-0000-000000000000/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'k', value: 'v' }] })
          .expect(404);
      });

      it('should return 404 when user is not a member of the workspace', async () => {
        // Create a user in a different workspace — they have no OrganizationUser row for orgId
        const { user: outsider } = await createUser(app, { email: 'outsider-meta@tooljet.io' });

        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${outsider.id}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'k', value: 'v' }] })
          .expect(404);
      });

      it('should return 404 when userId does not exist', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/00000000-0000-0000-0000-000000000000`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'k', value: 'v' }] })
          .expect(404);
      });
    });

    // ─── GET ────────────────────────────────────────────────────────────────

    describe('GET /api/ext/workspace/:workspaceId/user/:userId | Get user metadata', () => {
      it('should return 403 when Authorization header is missing', async () => {
        await request(app.getHttpServer()).get(`/api/ext/workspace/${orgId}/user/${memberId}`).expect(403);
      });

      it('should return empty userDetails for a user with no metadata', async () => {
        // Fresh user never written to — userDetails must be []
        const { user: freshAdmin } = await createUser(app, { email: 'fresh-meta-admin@tooljet.io' });
        const freshOrgId = freshAdmin.defaultOrganizationId;

        const createRes = await request(app.getHttpServer())
          .post('/api/ext/users')
          .set('Authorization', getExtAuth())
          .send({
            name: 'Fresh Meta User',
            email: 'fresh-meta-user@example.com',
            workspaces: [{ id: freshOrgId, status: 'active' }],
          })
          .expect(201);

        const freshUserId = createRes.body.id;

        const res = await request(app.getHttpServer())
          .get(`/api/ext/workspace/${freshOrgId}/user/${freshUserId}`)
          .set('Authorization', getExtAuth())
          .expect(200);

        expect(res.body).toMatchObject({
          id: freshUserId,
          userDetails: [],
        });
      });

      it('should return decrypted metadata matching the last PUT', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({
            userDetails: [
              { key: 'country', value: 'IN' },
              { key: 'language', value: 'en' },
            ],
          })
          .expect(200);

        const res = await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .expect(200);

        expect(res.body).toMatchObject({
          id: memberId,
          email: memberEmail,
          userDetails: expect.arrayContaining([
            { key: 'country', value: 'IN' },
            { key: 'language', value: 'en' },
          ]),
        });
      });

      it('should accept email as userId', async () => {
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'email-lookup', value: 'yes' }] })
          .expect(200);

        const res = await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgId}/user/${memberEmail}`)
          .set('Authorization', getExtAuth())
          .expect(200);

        expect(res.body.id).toBe(memberId);
        expect(res.body.userDetails).toEqual(expect.arrayContaining([{ key: 'email-lookup', value: 'yes' }]));
      });

      it('should return 404 when workspaceId does not exist', async () => {
        await request(app.getHttpServer())
          .get(`/api/ext/workspace/00000000-0000-0000-0000-000000000000/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .expect(404);
      });

      it('should return 404 when user is not a member of the workspace', async () => {
        const { user: outsider } = await createUser(app, { email: 'outsider-meta-get@tooljet.io' });

        await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgId}/user/${outsider.id}`)
          .set('Authorization', getExtAuth())
          .expect(404);
      });

      it('should return 403 when Authorization token is invalid', async () => {
        await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', 'Basic invalidtoken')
          .expect(403);
      });

      it('should return 404 when userId does not exist', async () => {
        await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgId}/user/00000000-0000-0000-0000-000000000000`)
          .set('Authorization', getExtAuth())
          .expect(404);
      });
    });

    // ─── Workspace isolation ─────────────────────────────────────────────────

    describe('Workspace isolation', () => {
      it('metadata written in workspace A is not readable via workspace B', async () => {
        // Workspace A — reuse existing orgId + memberId
        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'workspace', value: 'A' }] })
          .expect(200);

        // Workspace B — separate admin, separate workspace; member has no row here
        const { user: adminB } = await createUser(app, { email: 'isolation-admin-b@tooljet.io' });
        const orgBId = adminB.defaultOrganizationId;

        // Reading member's metadata through workspace B must 404 — member is not in B
        await request(app.getHttpServer())
          .get(`/api/ext/workspace/${orgBId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .expect(404);
      });

      it('metadata written in workspace A is not overwritable via workspace B', async () => {
        const { user: adminB } = await createUser(app, { email: 'isolation-admin-b2@tooljet.io' });
        const orgBId = adminB.defaultOrganizationId;

        await request(app.getHttpServer())
          .put(`/api/ext/workspace/${orgBId}/user/${memberId}`)
          .set('Authorization', getExtAuth())
          .send({ userDetails: [{ key: 'workspace', value: 'B-overwrite' }] })
          .expect(404);
      });
    });
  });
});
