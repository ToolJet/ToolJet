import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  login,
  updateEntity,
  saveEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';

/**
 * Regression coverage for GET /api/v2/apps/module/by-correlation/:coRelationId/version?ref=...
 * in a plain (non-git-sync) workspace.
 *
 * Root cause: resolveModuleRef's pinned-lookup tiers (by version name, by
 * module_reference_id UUID) filtered on `branchId: IsNull()`. Since
 * 1782400000000-BackfillWorkflowBranchIdAndEnforceNotNull, branch_id is NOT NULL
 * on every app_versions row — every org (git-sync or not) has a seeded default
 * WorkspaceBranch and every version is stamped with its id — so that filter never
 * matched anything and any *pinned* module reference 404'd with "Module version
 * not found", even though the version existed.
 *
 * A second, compounding bug: resolveModuleRef derived `isGitSyncEnabled` from
 * `!!defaultBranch` — but every org now has a default branch row regardless of
 * whether git-sync is actually configured, so that flag was always `true`,
 * skipping the any-status fallback meant for plain workspaces and 404ing on a
 * pin to a version that's still a DRAFT (never published/released).
 */
/** @group platform */
describe('Module version resolution by pinned ref (non-git-sync workspace)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  async function fetchModuleVersion(coRelationId: string, cookie: string[], orgId: string, ref: string) {
    return request(nestApp.getHttpServer())
      .get(`/api/v2/apps/module/by-correlation/${coRelationId}/version?mode=view&ref=${encodeURIComponent(ref)}`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie);
  }

  it('resolves a pin by exact version name (Tier 0) against a PUBLISHED version', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-admin1@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-admin1@tooljet.io')).tokenCookie;

    const moduleApp = await createApplication(nestApp, { name: 'M-NameTier', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    await updateEntity(AppVersion, version.id, {
      name: 'v7-without-table',
      status: AppVersionStatus.PUBLISHED,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, 'v7-without-table');
    expect(res.statusCode).toBe(200);
    expect(res.body.editing_version.id).toBe(version.id);
  });

  it('resolves a pin by module_reference_id UUID (Tier 1) against a PUBLISHED version', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-admin2@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-admin2@tooljet.io')).tokenCookie;

    const moduleApp = await createApplication(nestApp, { name: 'M-UuidTier', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    const moduleReferenceId = uuidv4();
    await updateEntity(AppVersion, version.id, {
      moduleReferenceId,
      status: AppVersionStatus.PUBLISHED,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, moduleReferenceId);
    expect(res.statusCode).toBe(200);
    expect(res.body.editing_version.id).toBe(version.id);
  });

  it('resolves a pin by name against a DRAFT-only version (no published/released version exists yet)', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-admin3@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-admin3@tooljet.io')).tokenCookie;

    const moduleApp = await createApplication(nestApp, { name: 'M-DraftPin', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    // Left at DRAFT status deliberately — the module has never been published/released,
    // which is the common state right after `task db:setup` / a fresh non-git-sync module.
    await updateEntity(AppVersion, version.id, {
      name: 'first-draft',
      status: AppVersionStatus.DRAFT,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, 'first-draft');
    expect(res.statusCode).toBe(200);
    expect(res.body.editing_version.id).toBe(version.id);
  });
});

/**
 * Regression coverage for the actual reported symptom: a module pinned before v51 beta,
 * pushed to git, then pulled into a FRESH git-sync workspace failed to resolve with
 * "Module version not found" — because isGitSyncEnabled was derived from `!!defaultBranch`
 * (always true post-backfill) and the pinned lookups filtered on `branchId: IsNull()`
 * (never true post-backfill). Fixed by deriving isGitSyncEnabled from the org's actual
 * GitSyncConfigsUtilService.getDetails().isEnabled and querying branchId: defaultBranch.id.
 */
describe('Module version resolution by pinned ref (git-sync-enabled workspace)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  async function fetchModuleVersion(coRelationId: string, cookie: string[], orgId: string, ref: string) {
    return request(nestApp.getHttpServer())
      .get(`/api/v2/apps/module/by-correlation/${coRelationId}/version?mode=view&ref=${encodeURIComponent(ref)}`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie);
  }

  it('resolves a UUID pin (Tier 1) to the default-branch PUBLISHED version', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-gs-admin1@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-gs-admin1@tooljet.io')).tokenCookie;

    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: org.id,
      autoCommit: false,
      isBranchingEnabled: true,
    });
    await saveEntity(OrganizationGitHttps, {
      configId: orgGitSync.id,
      httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
      githubBranch: 'main',
      githubAppId: 'test-app-id',
      githubInstallationId: 'test-installation-id',
      githubPrivateKey: 'dummy-key-not-dereferenced-in-this-test',
      isEnabled: true,
      isFinalized: true,
    } as any);

    const moduleApp = await createApplication(nestApp, { name: 'M-GitSyncUuid', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    const moduleReferenceId = uuidv4();
    await updateEntity(AppVersion, version.id, {
      moduleReferenceId,
      status: AppVersionStatus.PUBLISHED,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, moduleReferenceId);
    expect(res.statusCode).toBe(200);
    expect(res.body.editing_version.id).toBe(version.id);
  });

  async function enableGitSync(orgId: string) {
    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: orgId,
      autoCommit: false,
      isBranchingEnabled: true,
    });
    await saveEntity(OrganizationGitHttps, {
      configId: orgGitSync.id,
      httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
      githubBranch: 'main',
      githubAppId: 'test-app-id',
      githubInstallationId: 'test-installation-id',
      githubPrivateKey: 'dummy-key-not-dereferenced-in-this-test',
      isEnabled: true,
      isFinalized: true,
    } as any);
  }

  /**
   * Regression coverage: a module app/pin created before branching was enabled on the
   * workspace stores the pin as a plain version name (legacy format), not a
   * module_reference_id UUID. If that version has never been published/released, it sits
   * as a DRAFT on the default branch, with isSynced: false (stamped false by the
   * NOT-NULL backfill migration — it predates git-sync on this workspace). Tier 0's
   * any-status fallback used to be gated on `!isGitSyncEnabled`, so once the workspace
   * turned git-sync/branching on, this legacy DRAFT pin 404'd even though nothing about
   * the underlying data changed.
   */
  it('resolves a legacy (isSynced: false) name pin to a DRAFT-only version on the default branch', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-gs-admin2@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-gs-admin2@tooljet.io')).tokenCookie;

    await enableGitSync(org.id);

    const moduleApp = await createApplication(nestApp, {
      name: 'M-GitSyncDraftName',
      user: adminData.user,
      type: 'module',
    });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    // Left at DRAFT, pinned by name, isSynced forced false — never published/released,
    // same as a module pinned before this workspace had branching/git-sync enabled.
    await updateEntity(AppVersion, version.id, {
      name: 'v3',
      status: AppVersionStatus.DRAFT,
      isSynced: false,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, 'v3');
    expect(res.statusCode).toBe(200);
    expect(res.body.editing_version.id).toBe(version.id);
  });

  /**
   * Guardrail: a genuinely git-native draft (isSynced: true — created through this
   * workspace's own git-sync flow, not a legacy backfilled row) must NOT be resolvable
   * by name unless it's PUBLISHED. The Tier 0 fallback added above must not relax this —
   * it's scoped to isSynced: false rows only.
   */
  it('does NOT resolve a synced (isSynced: true) name-pinned DRAFT — still 404s', async () => {
    const adminData = await createUser(nestApp, { email: 'mrr-gs-admin3@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;
    const adminCookie = (await login(nestApp, 'mrr-gs-admin3@tooljet.io')).tokenCookie;

    await enableGitSync(org.id);

    const moduleApp = await createApplication(nestApp, {
      name: 'M-GitSyncSyncedDraftName',
      user: adminData.user,
      type: 'module',
    });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    const version = await createApplicationVersion(nestApp, moduleApp as any);
    await updateEntity(AppVersion, version.id, {
      name: 'v3',
      status: AppVersionStatus.DRAFT,
      isSynced: true,
    } as any);

    const res = await fetchModuleVersion(coRelationId, adminCookie, org.id, 'v3');
    expect(res.statusCode).toBe(404);
  });
});
