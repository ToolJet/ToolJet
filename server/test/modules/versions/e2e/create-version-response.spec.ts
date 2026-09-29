import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getAppEnvironment,
  login,
  findEntities,
} from 'test-helper';
import { AppVersion } from '@entities/app_version.entity';

/**
 * Response-shape coverage for the version-create inline path (tj-ee#5486): narrows the
 * decamelized-entity response to CreateVersionResponseDto, and layers the Idempotency-Key
 * interceptor + name-exists pre-check on top of the existing DB unique constraint.
 *
 * @group platform
 */
describe('POST /api/apps/:id/versions — response shape + idempotency', () => {
  let nestApp: INestApplication;
  let tokenCookie: string;
  let orgId: string;
  let appId: string;
  let versionFromId: string;
  let environmentId: string;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization, user } = await createUser(nestApp, { email: 'cvr-admin@tooljet.io' });
    orgId = organization.id;
    tokenCookie = (await login(nestApp, 'cvr-admin@tooljet.io')).tokenCookie;

    const application = await createApplication(nestApp, { name: 'cvr-app', user });
    appId = application.id;
    const version = await createApplicationVersion(nestApp, application as any);
    versionFromId = version.id;
    environmentId = (await getAppEnvironment(null, 1)).id;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('creates the version inline and returns the narrowed shape', async () => {
    const res = await request(nestApp.getHttpServer())
      .post(`/api/apps/${appId}/versions`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', tokenCookie)
      .send({ versionName: 'v2', versionFromId, environmentId });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      enqueued: false,
      id: expect.any(String),
      name: 'v2',
      current_environment_id: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('definition');
  });

  it('replays the same body for a repeated Idempotency-Key and creates the version once', async () => {
    const idempotencyKey = randomUUID();
    const body = { versionName: 'v-idem', versionFromId, environmentId };

    const first = await request(nestApp.getHttpServer())
      .post(`/api/apps/${appId}/versions`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', tokenCookie)
      .set('Idempotency-Key', idempotencyKey)
      .send(body);
    expect(first.statusCode).toBe(201);

    const second = await request(nestApp.getHttpServer())
      .post(`/api/apps/${appId}/versions`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', tokenCookie)
      .set('Idempotency-Key', idempotencyKey)
      .send(body);
    expect(second.statusCode).toBe(201);

    expect(second.body).toEqual(first.body);

    const versions = await findEntities(AppVersion, { where: { appId, name: 'v-idem' } });
    expect(versions).toHaveLength(1);
  });

  it('rejects a duplicate version name without an Idempotency-Key', async () => {
    await request(nestApp.getHttpServer())
      .post(`/api/apps/${appId}/versions`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', tokenCookie)
      .send({ versionName: 'v-dup', versionFromId, environmentId })
      .expect(201);

    const res = await request(nestApp.getHttpServer())
      .post(`/api/apps/${appId}/versions`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', tokenCookie)
      .send({ versionName: 'v-dup', versionFromId, environmentId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Version name already exists.');
  });
});
