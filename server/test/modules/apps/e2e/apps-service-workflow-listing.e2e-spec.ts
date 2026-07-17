import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, ensureAppEnvironments, findEntityOrFail, saveEntity, updateEntity } from 'test-helper';

/** @group platform */
describe('AppsService — workflow metadata in create response and listing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('POST /apps should mirror name/slug/icon/isPublic onto the response for a new workflow', async () => {
    const admin = await createAdmin(app, 'service-create-admin@tooljet.io');
    // createAdmin/createUser create the org via a bare repository.save, bypassing the
    // production signup flow that auto-seeds AppEnvironment rows — POST /apps needs them
    // seeded explicitly (mirrors the pattern in apps-util-service-create.e2e-spec.ts and
    // workflow-create-branch-id.e2e-spec.ts).
    await ensureAppEnvironments(app, admin.workspace.id);

    const res = await request(app.getHttpServer())
      .post('/api/apps')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Service Create Workflow', type: 'workflow', icon: 'svc-icon.svg' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Service Create Workflow',
      slug: res.body.id,
      icon: 'svc-icon.svg',
      is_public: false,
    });
  });

  it('GET /apps?type=workflow should include name/slug/icon/isPublic for listed workflows', async () => {
    const admin = await createAdmin(app, 'service-list-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/apps')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Service List Workflow', type: 'workflow' });

    const listRes = await request(app.getHttpServer())
      .get('/api/apps')
      .query({ type: 'workflow' })
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id);

    expect(listRes.status).toBe(200);
    const listedApp = listRes.body.apps.find((a: any) => a.id === createRes.body.id);
    expect(listedApp).toMatchObject({ name: 'Service List Workflow', slug: createRes.body.id });
  });

  // The two tests above never send a branch_id, so they never exercise the
  // `if (branchId)` branch of AppsService.getAllApps's listing overlay — that block had
  // its own workflow `continue` guard removed in this same change and needs its own
  // coverage. GET /apps derives branchId strictly from the `branch_id` query param
  // (controller.ts's `index` handler reads `query.branch_id`, not the `x-branch-id`
  // header / `user.branchId` — deliberately, per the comment there, since a
  // header-derived default would break workflow/non-git listing).
  it('GET /apps?type=workflow&branch_id=<default> should overlay branch-scoped app_versions metadata for workflows', async () => {
    const admin = await createAdmin(app, 'service-branch-list-admin@tooljet.io');
    await ensureAppEnvironments(app, admin.workspace.id);

    // createAdmin seeds the org via a raw entity save, bypassing the production
    // signup flow that auto-creates a default WorkspaceBranch — seed one explicitly,
    // and enable git-sync so the org has real branch semantics.
    const defaultBranch = await saveEntity(WorkspaceBranch, {
      organizationId: admin.workspace.id,
      name: 'main',
      isDefault: true,
    } as any);
    await saveEntity(OrganizationGitSync, {
      organizationId: admin.workspace.id,
    } as any);

    const createRes = await request(app.getHttpServer())
      .post('/api/apps')
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id)
      .send({ name: 'Branch Overlay Workflow', type: 'workflow' });

    expect(createRes.status).toBe(201);

    // Workflows always resolve to the org's default branch on create (independent of
    // this task) — confirm the seeded branch is the one the version actually landed on.
    const version = await findEntityOrFail(AppVersion, { appId: createRes.body.id });
    expect(version.branchId).toBe(defaultBranch.id);

    // Overwrite the branch version with sentinel values distinct from what create()
    // wrote, so the assertion below can only pass if the listing overlay re-reads the
    // branch row live rather than reflecting stale create-time values.
    await updateEntity(AppVersion, version.id, {
      appName: 'Branch Overlay Name',
      slug: 'branch-overlay-slug',
      icon: 'branch-overlay-icon.svg',
      isPublic: true,
    } as any);

    const listRes = await request(app.getHttpServer())
      .get('/api/apps')
      .query({ type: 'workflow', branch_id: defaultBranch.id })
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id);

    expect(listRes.status).toBe(200);
    const listedApp = listRes.body.apps.find((a: any) => a.id === createRes.body.id);
    expect(listedApp).toMatchObject({
      name: 'Branch Overlay Name',
      slug: 'branch-overlay-slug',
      icon: 'branch-overlay-icon.svg',
      is_public: true,
    });
  });
});
