import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, ensureAppEnvironments, getAllEnvironments, login } from 'test-helper';

/**
 * Case-sensitivity of data source names.
 *
 * Data source name uniqueness is case-SENSITIVE: two sources whose names differ
 * only in casing ("CasingDataSource" / "casingdatasource") are distinct and must
 * coexist within the same workspace/branch. This mirrors the app/module rule
 * shipped in MakeAppNameUniqueCaseSensitive1780000000000.
 *
 * Enforced by:
 *   - idx_unique_active_name_branch on (name, branch_id) WHERE is_active = true
 *     (MakeDataSourceVersionNameCaseSensitive1785500000000 — was LOWER(name)).
 *   - generateUniqueName / ensureUniqueActiveNameForUpdate in
 *     data-sources/util.service.ts (exact-case comparison).
 *
 * NOTE: these expectations only hold once the case-sensitive migration has been
 * applied to the test DB; before it, the LOWER(name) index rejects the second
 * create.
 */
/** @group platform */
describe('Data source name casing (case-sensitive coexistence)', () => {
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

  const createDataSource = (orgId: string, workspaceId: string, cookie: string[], name: string): request.Test =>
    request(nestApp.getHttpServer())
      .post('/api/data-sources')
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send({ name, kind: 'restapi', options: [] });

  it('allows two data sources whose names differ only in casing to coexist', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'ds-casing-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const first = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'CasingDataSource'
    );
    expect(first.statusCode).toBe(201);
    expect(first.body.name).toBe('CasingDataSource');

    // The lower-cased variant must be created verbatim (NOT auto-suffixed to
    // "casingdatasource_2" and NOT rejected as a duplicate).
    const second = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'casingdatasource'
    );
    expect(second.statusCode).toBe(201);
    expect(second.body.name).toBe('casingdatasource');
    expect(second.body.id).not.toBe(first.body.id);

    // Both are listed as distinct data sources.
    const list = await request(nestApp.getHttpServer())
      .get(`/api/data-sources/${adminUserData.organization.id}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', loggedUser.tokenCookie);

    expect(list.statusCode).toBe(200);
    const names = list.body.data_sources.map((ds: any) => ds.name);
    expect(names).toContain('CasingDataSource');
    expect(names).toContain('casingdatasource');
  });

  it('still rejects an exact-case duplicate by auto-suffixing it', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'ds-casing-dup-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const first = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'ExactDup'
    );
    expect(first.statusCode).toBe(201);
    expect(first.body.name).toBe('ExactDup');

    // Same casing => collision => generateUniqueName suffixes it.
    const second = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'ExactDup'
    );
    expect(second.statusCode).toBe(201);
    expect(second.body.name).toBe('ExactDup_2');
  });

  it('allows renaming a data source to a name that differs only in casing from another', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'ds-casing-rename-admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await ensureAppEnvironments(nestApp, adminUserData.organization.id);
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const workspaceId = adminUserData.user.defaultOrganizationId;

    const target = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'RenameTarget'
    );
    expect(target.statusCode).toBe(201);

    const mover = await createDataSource(
      adminUserData.organization.id,
      workspaceId,
      loggedUser.tokenCookie,
      'MoverSource'
    );
    expect(mover.statusCode).toBe(201);

    const environments = await getAllEnvironments(nestApp, adminUserData.organization.id);
    const defaultEnv = environments.find((e: any) => e.isDefault) || environments[0];

    // Rename "MoverSource" -> "renametarget" (case variant of "RenameTarget").
    // ensureUniqueActiveNameForUpdate must treat them as distinct and allow it.
    const rename = await request(nestApp.getHttpServer())
      .put(`/api/data-sources/${mover.body.id}?environment_id=${defaultEnv.id}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({ name: 'renametarget', options: [] });

    expect(rename.statusCode).toBe(200);
  });
});
