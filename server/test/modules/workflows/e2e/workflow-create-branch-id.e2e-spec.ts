import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, findEntityOrFail, ensureAppEnvironments } from 'test-helper';

/** @group platform */
describe('POST /workflows — branch_id nullability', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should create a workflow with a NULL branch_id on its app_versions row', async () => {
    const admin = await createAdmin(app, 'workflow-branch-id-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);

    const res = await request(app.getHttpServer())
      .post('/api/workflows')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Branch ID Test Workflow', type: 'workflow' });

    expect(res.status).toBe(201);

    const version = await findEntityOrFail(AppVersion, { appId: res.body.id });
    expect(version.branchId).toBeNull();
  });

  it('should still require branch_id for a non-workflow app', async () => {
    const admin = await createAdmin(app, 'app-branch-id-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);

    const res = await request(app.getHttpServer())
      .post('/api/apps')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Branch ID Test App', type: 'front-end' });

    expect(res.status).toBe(201);

    const version = await findEntityOrFail(AppVersion, { appId: res.body.id });
    expect(version.branchId).not.toBeNull();
  });
});
