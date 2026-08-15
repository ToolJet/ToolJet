import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, findEntity, findEntityOrFail, saveEntity, ensureAppEnvironments } from 'test-helper';

/**
 * Task 3.5: workflows now always resolve to the org's default branch instead of
 * permanently carrying branch_id = NULL (Task 0's now-superseded design) — see
 * workflow-create-branch-id.e2e-spec.ts for the prior (now-updated) NULL-branch_id
 * assertion this supersedes.
 */
/** @group platform */
describe('POST /workflows — default branch_id assignment', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  // The `createAdmin` test helper creates the organization via a raw entity save
  // (test/helpers/seed.ts's createUser), bypassing SetupOrganizationsUtilService.create
  // — the production path that seeds a default WorkspaceBranch for every new org. So
  // test orgs don't get one automatically; ensure it here the same way
  // createApplicationVersion does for other app-version specs.
  async function ensureDefaultBranch(organizationId: string): Promise<WorkspaceBranch> {
    const existing = await findEntity(WorkspaceBranch, { organizationId, isDefault: true });
    if (existing) return existing;
    return await saveEntity(WorkspaceBranch, { organizationId, name: 'main', isDefault: true });
  }

  it("assigns a freshly-created workflow's app_versions row the org's default branch_id", async () => {
    const admin = await createAdmin(app, 'workflow-default-branch-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);
    const defaultBranch = await ensureDefaultBranch(admin.workspace.id);

    const res = await request(app.getHttpServer())
      .post('/api/workflows')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Default Branch Workflow', type: 'workflow' });

    expect(res.status).toBe(201);

    const version = await findEntityOrFail(AppVersion, { appId: res.body.id });
    expect(version.branchId).not.toBeNull();
    expect(version.branchId).toBe(defaultBranch.id);
  });

  it('ignores a DTO-supplied branchId for a workflow and still resolves to the org default', async () => {
    const admin = await createAdmin(app, 'workflow-dto-branch-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);
    const defaultBranch = await ensureDefaultBranch(admin.workspace.id);

    // A bogus (well-formed but non-existent) branchId in the DTO — if it were honoured,
    // the create call would either fail (unresolvable branch) or attach the wrong
    // branch. It must be ignored entirely for workflows.
    const res = await request(app.getHttpServer())
      .post('/api/workflows')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'DTO Branch Ignored Workflow', type: 'workflow', branchId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(201);

    const version = await findEntityOrFail(AppVersion, { appId: res.body.id });
    expect(version.branchId).toBe(defaultBranch.id);
  });
});
