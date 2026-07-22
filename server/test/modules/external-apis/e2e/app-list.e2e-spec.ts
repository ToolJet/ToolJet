import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, createApplication, createApplicationVersion } from 'test-helper';

/**
 * External API — GET /ext/workspace/:workspaceId/apps
 *
 * Lists every app in a workspace with its versions.
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 400: non-UUID workspaceId, valid UUID workspace that does not exist
 *   - Happy path: empty list, response shape (id/name/slug/organizationId/versions),
 *     multiple apps + multiple versions, workspace scoping
 */

const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

/** @group platform */
describe('External API — GET /ext/workspace/:workspaceId/apps', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('returns 403 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).get(`/api/ext/workspace/${NONEXISTENT_UUID}/apps`).expect(403);
  });

  it('returns 403 when the access token is wrong', async () => {
    await request(app.getHttpServer())
      .get(`/api/ext/workspace/${NONEXISTENT_UUID}/apps`)
      .set('Authorization', 'Basic wrong-token')
      .expect(403);
  });

  it('returns 400 for a non-UUID workspaceId', async () => {
    await request(app.getHttpServer())
      .get('/api/ext/workspace/not-a-uuid/apps')
      .set('Authorization', AUTH_HEADER)
      .expect(400);
  });

  it('returns 400 for a valid UUID workspace that does not exist', async () => {
    await request(app.getHttpServer())
      .get(`/api/ext/workspace/${NONEXISTENT_UUID}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(400);
  });

  it('returns an empty list when the workspace has no apps', async () => {
    const { user } = await createUser(app, { email: `applist-empty-${Date.now()}@tooljet.io` });

    const res = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${user.defaultOrganizationId}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('returns the correct shape with organizationId and versions populated', async () => {
    const { user, organization } = await createUser(app, { email: `applist-shape-${Date.now()}@tooljet.io` });
    const seededApp = await createApplication(app, { name: 'Shape App', user });
    const version = await createApplicationVersion(app, seededApp);

    const res = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${organization.id}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    expect(res.body).toHaveLength(1);
    const entry = res.body[0];
    expect(entry).toMatchObject({ id: seededApp.id, name: 'Shape App', organizationId: organization.id });
    expect(entry).toHaveProperty('slug');
    expect(Array.isArray(entry.versions)).toBe(true);
    expect(entry.versions).toHaveLength(1);
    expect(entry.versions[0]).toMatchObject({ id: version.id, name: version.name });
  });

  it('lists multiple apps, each with their own versions', async () => {
    const { user, organization } = await createUser(app, { email: `applist-multi-${Date.now()}@tooljet.io` });
    const appA = await createApplication(app, { name: 'App A', user });
    await createApplicationVersion(app, appA, { name: 'v1' });
    await createApplicationVersion(app, appA, { name: 'v2' });
    const appB = await createApplication(app, { name: 'App B', user }, false);
    await createApplicationVersion(app, appB);

    const res = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${organization.id}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    expect(res.body).toHaveLength(2);
    const shapeAppA = res.body.find((a: any) => a.id === appA.id);
    expect(shapeAppA.versions).toHaveLength(2);
    const shapeAppB = res.body.find((a: any) => a.id === appB.id);
    expect(shapeAppB.versions).toHaveLength(1);
  });

  it('scopes results to the given workspace only', async () => {
    const { user: user1, organization: org1 } = await createUser(app, { email: `applist-scope-1-${Date.now()}@tooljet.io` });
    const { user: user2 } = await createUser(app, { email: `applist-scope-2-${Date.now()}@tooljet.io` });

    await createApplication(app, { name: 'Org1 App', user: user1 });
    await createApplication(app, { name: 'Org2 App', user: user2 });

    const res = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${org1.id}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Org1 App');
  });
});
