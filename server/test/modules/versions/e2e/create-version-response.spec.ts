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
} from 'test-helper';

/**
 * Request contract for POST /apps/:id/versions on EE (tj-ee#5486): every create that copies an
 * owned version is handed to the app-version worker and answered with an enqueue ack. Covers what
 * happens in the request — the ack, Idempotency-Key replay, and the name-exists pre-check. The
 * worker body is covered by version-queue.spec.ts; CE's inline path by create-or-enqueue-version.spec.ts.
 *
 * @group platform
 */
describe('POST /api/apps/:id/versions — EE (plan: enterprise) | enqueue ack + idempotency', () => {
  let nestApp: INestApplication;
  let post: (body: object, idempotencyKey?: string) => request.Test;
  let existingVersionName: string;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization, user } = await createUser(nestApp, { email: 'cvr-admin@tooljet.io' });
    const tokenCookie = (await login(nestApp, 'cvr-admin@tooljet.io')).tokenCookie;
    const application = await createApplication(nestApp, { name: 'cvr-app', user });
    const version = await createApplicationVersion(nestApp, application as any);
    existingVersionName = version.name;
    const environmentId = (await getAppEnvironment(null, 1)).id;
    post = (body, idempotencyKey) => {
      const req = request(nestApp.getHttpServer())
        .post(`/api/apps/${application.id}/versions`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', tokenCookie);
      if (idempotencyKey) req.set('Idempotency-Key', idempotencyKey);
      return req.send({ versionFromId: version.id, environmentId, ...body });
    };
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('should answer with an enqueue ack instead of the created version', async () => {
    const res = await post({ versionName: 'v2' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ enqueued: true });
  });

  it('should replay the same body for a repeated Idempotency-Key', async () => {
    const idempotencyKey = randomUUID();

    const first = await post({ versionName: 'v-idem' }, idempotencyKey);
    const second = await post({ versionName: 'v-idem' }, idempotencyKey);

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.body).toEqual(first.body);
  });

  it('should reject an existing version name before enqueueing', async () => {
    const res = await post({ versionName: existingVersionName });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Version name already exists.');
  });
});
