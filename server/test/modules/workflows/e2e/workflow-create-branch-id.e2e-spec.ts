import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, findEntity, findEntityOrFail, saveEntity, ensureAppEnvironments } from 'test-helper';

/** @group platform */
describe('POST /workflows — branch_id assignment', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  // The `createAdmin` test helper creates the organization via a raw entity save,
  // bypassing SetupOrganizationsUtilService.create (the production path that seeds a
  // default WorkspaceBranch for every new org) — ensure one exists here.
  async function ensureDefaultBranch(organizationId: string): Promise<WorkspaceBranch> {
    const existing = await findEntity(WorkspaceBranch, { organizationId, isDefault: true });
    if (existing) return existing;
    return await saveEntity(WorkspaceBranch, { organizationId, name: 'main', isDefault: true });
  }

  // Task 3.5 superseded Task 0's NULL-branch_id design: workflows now always resolve to
  // the org's default branch (see workflow-branch-id-assignment.e2e-spec.ts for the fuller
  // coverage of that behavior, including the DTO-supplied-branchId-is-ignored case).
  it("should create a workflow with the org's default (non-null) branch_id on its app_versions row", async () => {
    const admin = await createAdmin(app, 'workflow-branch-id-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);
    const defaultBranch = await ensureDefaultBranch(admin.workspace.id);

    const res = await request(app.getHttpServer())
      .post('/api/workflows')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Branch ID Test Workflow', type: 'workflow' });

    expect(res.status).toBe(201);

    const version = await findEntityOrFail(AppVersion, { appId: res.body.id });
    expect(version.branchId).toBe(defaultBranch.id);
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
