import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, ensureAppEnvironments, login } from 'test-helper';

/**
 * Case-sensitivity of app and module names.
 *
 * App/module name uniqueness is case-SENSITIVE (shipped in
 * MakeAppNameUniqueCaseSensitive1780000000000): names differing only in casing
 * ("CasingApp" / "casingapp") are distinct and coexist on the same branch.
 * Enforced by the enforce_app_versions_app_name_branch_unique trigger (exact
 * av.app_name = NEW.app_name) and the matching app-layer pre-check in
 * apps/util.service.ts.
 *
 * Uniqueness is also type-scoped: a front-end app and a module may share a name
 * (they live in separate dashboards), so that case is covered here too.
 *
 * Apps/modules are the same `apps` table (distinguished by `type`), so both are
 * exercised through POST /api/apps.
 */
/** @group platform */
describe('App/module name casing (case-sensitive coexistence)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const createApp = (workspaceId: string, cookie: string[], name: string, type: 'front-end' | 'module'): request.Test =>
    request(nestApp.getHttpServer())
      .post('/api/apps')
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send({ name, type });

  it('allows two front-end apps whose names differ only in casing to coexist', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'app-casing-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const first = await createApp(workspaceId, loggedUser.tokenCookie, 'CasingApp', 'front-end');
    expect(first.statusCode).toBe(201);

    const second = await createApp(workspaceId, loggedUser.tokenCookie, 'casingapp', 'front-end');
    expect(second.statusCode).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });

  it('rejects an exact-case duplicate app name', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'app-casing-dup-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const first = await createApp(workspaceId, loggedUser.tokenCookie, 'ExactApp', 'front-end');
    expect(first.statusCode).toBe(201);

    const dup = await createApp(workspaceId, loggedUser.tokenCookie, 'ExactApp', 'front-end');
    expect(dup.statusCode).toBe(400);
    expect(dup.body.message).toMatch(/already taken/i);
  });

  it('allows two modules whose names differ only in casing to coexist', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'module-casing-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const first = await createApp(workspaceId, loggedUser.tokenCookie, 'CasingModule', 'module');
    expect(first.statusCode).toBe(201);

    const second = await createApp(workspaceId, loggedUser.tokenCookie, 'casingmodule', 'module');
    expect(second.statusCode).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });

  it('allows renaming a front-end app to a name that differs only in casing from another', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'app-casing-rename-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const target = await createApp(workspaceId, loggedUser.tokenCookie, 'EditTarget', 'front-end');
    expect(target.statusCode).toBe(201);
    const mover = await createApp(workspaceId, loggedUser.tokenCookie, 'EditMover', 'front-end');
    expect(mover.statusCode).toBe(201);

    // Rename "EditMover" -> "edittarget" (case variant of "EditTarget"): allowed.
    const rename = await request(nestApp.getHttpServer())
      .put(`/api/apps/${mover.body.id}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({ app: { name: 'edittarget' } });

    expect(rename.statusCode).toBe(200);
  });

  it('rejects renaming a front-end app to an exact-case duplicate (control)', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'app-casing-rename-dup-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const target = await createApp(workspaceId, loggedUser.tokenCookie, 'DupTarget', 'front-end');
    expect(target.statusCode).toBe(201);
    const mover = await createApp(workspaceId, loggedUser.tokenCookie, 'DupMover', 'front-end');
    expect(mover.statusCode).toBe(201);

    const rename = await request(nestApp.getHttpServer())
      .put(`/api/apps/${mover.body.id}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({ app: { name: 'DupTarget' } });

    // Rejected as a duplicate. The rename path surfaces the app_versions name
    // unique violation from the UPDATE as 409 Conflict (create's app-layer
    // pre-check returns 400; rename relies on the DB constraint).
    expect(rename.statusCode).toBe(409);
  });

  it('allows renaming a module to a name that differs only in casing from another', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'module-casing-rename-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const target = await createApp(workspaceId, loggedUser.tokenCookie, 'ModEditTarget', 'module');
    expect(target.statusCode).toBe(201);
    const mover = await createApp(workspaceId, loggedUser.tokenCookie, 'ModEditMover', 'module');
    expect(mover.statusCode).toBe(201);

    const rename = await request(nestApp.getHttpServer())
      .put(`/api/apps/${mover.body.id}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({ app: { name: 'modedittarget' } });

    expect(rename.statusCode).toBe(200);
  });

  it('allows a front-end app and a module to share the same name (type-scoped)', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'app-module-sharename-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const app = await createApp(workspaceId, loggedUser.tokenCookie, 'SharedName', 'front-end');
    expect(app.statusCode).toBe(201);

    const module = await createApp(workspaceId, loggedUser.tokenCookie, 'SharedName', 'module');
    expect(module.statusCode).toBe(201);
    expect(module.body.id).not.toBe(app.body.id);
  });
});
