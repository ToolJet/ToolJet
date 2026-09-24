import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { findEntityOrFail } from 'test-helper';

/** @group platform */
describe('PUT /apps/:id | workflow slug collision', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should reject renaming a workflow to a slug already used by another workflow, not evict it', async () => {
    const admin = await createAdmin(app, 'update-collision-admin@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;

    const workflowA = await createApplication(app, { name: 'Workflow A', user: orgUser, type: 'workflow' });
    const workflowB = await createApplication(
      app,
      { name: 'Workflow B', user: orgUser, type: 'workflow' },
      false // same org as workflowA — envs already seeded, avoid unique_organization_id_priority collision
    );
    const versionA = await createApplicationVersion(app, workflowA as any);
    const versionB = await createApplicationVersion(app, workflowB as any);
    await updateEntity(AppVersion, versionA.id, { slug: 'workflow-a-slug' });
    await updateEntity(AppVersion, versionB.id, { slug: 'workflow-b-slug' });

    const res = await request(app.getHttpServer())
      .put(`/api/apps/${workflowB.id}`)
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ app: { slug: 'workflow-a-slug' } });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already taken/);

    // The bug being fixed: workflow A's slug must NOT have been silently evicted.
    const reloadedA = await findEntityOrFail(App, { id: workflowA.id });
    expect(reloadedA.slug).toBeNull(); // apps.slug is never auto-filled for workflows post-migration; slug lives on app_versions
    const reloadedVersionA = await findEntityOrFail(AppVersion, { id: versionA.id });
    expect(reloadedVersionA.slug).toBe('workflow-a-slug');
  });
});
