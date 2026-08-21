import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  login,
  saveEntity,
  updateEntity,
  findEntities,
  createApplication,
  createApplicationVersion,
  resolveOrSeedDefaultBranch,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';

/**
 * Behaviour of an UNSYNCED app on a git-sync-enabled workspace — an app that existed
 * (and its versions were authored) BEFORE git-sync was turned on, so its version rows
 * carry `is_synced = false` and were never pushed to git.
 *
 * Covered:
 *   1. Unsynced apps are exempt from the single-draft-per-branch rule (util.service.ts
 *      createVersion): they can create multiple DRAFTs / save versions like a non-git
 *      workspace. A SYNCED app on the same workspace is held to one draft.
 *   2. The app connects to a module: the ModuleViewer versions API
 *      (GET /api/apps/:moduleId/versions?parentAppId=&branch_id=) lists ALL of the
 *      module's versions, and the module version can be switched (the pin resolves to
 *      whichever version it points at).
 *   3. The app connects to data sources that are a mix of synced and unsynced — neither
 *      blocks the unsynced app from creating/saving versions.
 */
/** @group gitsync */
describe('Unsynced app on a git-sync-enabled workspace', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  // Git-sync ON (single-branch): isEnabled → true, everything lives on the default branch —
  // the natural home of an app that pre-dates git being turned on.
  async function enableGitSync(orgId: string) {
    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: orgId,
      autoCommit: false,
      isBranchingEnabled: false,
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

  function authGet(url: string, cookie: string[], orgId: string) {
    return request(nestApp.getHttpServer()).get(url).set('Cookie', cookie).set('tj-workspace-id', orgId);
  }
  function authPost(url: string, cookie: string[], orgId: string) {
    return request(nestApp.getHttpServer()).post(url).set('Cookie', cookie).set('tj-workspace-id', orgId);
  }

  // A first draft VERSION row on the default branch, matching how a pre-git app's editable
  // version looks. isSynced toggles the "was it ever pushed to git" state under test.
  async function seedEditableVersion(app: App, branchId: string, isSynced: boolean): Promise<AppVersion> {
    const version = await createApplicationVersion(nestApp, app as any, { name: 'v1' });
    await updateEntity(AppVersion, version.id, {
      branchId,
      versionType: AppVersionType.VERSION,
      status: AppVersionStatus.DRAFT,
      isSynced,
    } as any);
    // Reflect the branch on the in-memory row so downstream seed helpers (createDataSource,
    // whose DSV branch_id is NOT NULL) read the right branch from it.
    version.branchId = branchId;
    return version;
  }

  it('lets an UNSYNCED app create multiple drafts while a SYNCED app is capped at one', async () => {
    const admin = await createUser(nestApp, {
      email: `uav-multi-${Date.now()}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    const org = admin.organization;
    const cookie = (await login(nestApp, admin.user.email)).tokenCookie;
    await enableGitSync(org.id);
    const branchId = (await resolveOrSeedDefaultBranch(org.id)).id;

    // ---- Unsynced app: multiple drafts allowed ----
    const unsyncedApp = await createApplication(nestApp, { name: 'unsynced-multi', user: admin.user });
    const v1 = await seedEditableVersion(unsyncedApp, branchId, /* isSynced */ false);

    await authPost(`/api/apps/${unsyncedApp.id}/versions`, cookie, org.id)
      .query({ branch_id: branchId })
      .send({ versionName: 'v2', versionFromId: v1.id })
      .expect(201);
    await authPost(`/api/apps/${unsyncedApp.id}/versions`, cookie, org.id)
      .query({ branch_id: branchId })
      .send({ versionName: 'v3', versionFromId: v1.id })
      .expect(201);

    const unsyncedDrafts = await findEntities(AppVersion, {
      where: { appId: unsyncedApp.id, status: AppVersionStatus.DRAFT, versionType: AppVersionType.VERSION },
    });
    expect(unsyncedDrafts.length).toBeGreaterThanOrEqual(3);
    // Every draft stays unsynced (inherited from the source), which is what keeps the
    // exemption in effect for the next draft.
    expect(unsyncedDrafts.every((v) => v.isSynced === false)).toBe(true);

    // ---- Synced app: single-draft rule enforced ----
    const syncedApp = await createApplication(nestApp, { name: 'synced-multi', user: admin.user });
    const sv1 = await seedEditableVersion(syncedApp, branchId, /* isSynced */ true);

    const blocked = await authPost(`/api/apps/${syncedApp.id}/versions`, cookie, org.id)
      .query({ branch_id: branchId })
      .send({ versionName: 'v2', versionFromId: sv1.id });
    expect(blocked.statusCode).toBe(400);
    expect(blocked.body.message).toContain('Only one draft version is allowed');
  });

  it('lists all module versions for an embedded module and switches between them', async () => {
    const admin = await createUser(nestApp, {
      email: `uav-mod-${Date.now()}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    const org = admin.organization;
    const cookie = (await login(nestApp, admin.user.email)).tokenCookie;
    await enableGitSync(org.id);
    const branchId = (await resolveOrSeedDefaultBranch(org.id)).id;

    // A module with TWO saved versions on the default branch.
    const moduleApp = await createApplication(nestApp, { name: 'shared-module', user: admin.user, type: 'module' });
    const moduleCoRel = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: moduleCoRel } as any);

    const makeModuleVersion = async (name: string) => {
      const v = await createApplicationVersion(nestApp, moduleApp as any, { name });
      const moduleReferenceId = uuidv4();
      await updateEntity(AppVersion, v.id, {
        branchId,
        versionType: AppVersionType.VERSION,
        status: AppVersionStatus.PUBLISHED,
        isStub: false,
        moduleReferenceId,
      } as any);
      return { id: v.id, moduleReferenceId };
    };
    const modV1 = await makeModuleVersion('m1');
    const modV2 = await makeModuleVersion('m2');

    // An unsynced consumer app that embeds the module via a ModuleViewer pinned to v1.
    const consumerApp = await createApplication(nestApp, { name: 'unsynced-consumer', user: admin.user });
    const consumerVersion = await seedEditableVersion(consumerApp, branchId, /* isSynced */ false);
    const homePage = await saveEntity(Page, {
      name: 'home',
      handle: 'home',
      appVersionId: consumerVersion.id,
      index: 1,
    } as any);
    await saveEntity(Component, {
      name: 'moduleviewer1',
      type: 'ModuleViewer',
      pageId: homePage.id,
      properties: {
        moduleAppId: { value: moduleCoRel },
        moduleVersionId: { value: modV1.moduleReferenceId },
      },
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as any);

    // The ModuleViewer versions API lists ALL of the module's versions (the picker source).
    const listResp = await authGet(`/api/apps/${moduleApp.id}/versions`, cookie, org.id)
      .query({ parentAppId: consumerApp.id, branch_id: branchId })
      .expect(200);
    const listedIds = listResp.body.versions.map((v: any) => v.id);
    expect(listedIds).toEqual(expect.arrayContaining([modV1.id, modV2.id]));

    // Switching the pin resolves to whichever version it points at.
    const resolve = (ref: string) =>
      authGet(`/api/v2/apps/module/by-correlation/${moduleCoRel}/version`, cookie, org.id).query({
        mode: 'view',
        ref,
        parentAppId: consumerApp.id,
        branch_id: branchId,
      });

    const toV1 = await resolve(modV1.moduleReferenceId).expect(200);
    expect(toV1.body.editing_version.id).toBe(modV1.id);
    const toV2 = await resolve(modV2.moduleReferenceId).expect(200);
    expect(toV2.body.editing_version.id).toBe(modV2.id);
  });

  it('creates versions on an unsynced app that connects to both synced and unsynced data sources', async () => {
    const admin = await createUser(nestApp, {
      email: `uav-ds-${Date.now()}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    const org = admin.organization;
    const cookie = (await login(nestApp, admin.user.email)).tokenCookie;
    await enableGitSync(org.id);
    const branchId = (await resolveOrSeedDefaultBranch(org.id)).id;

    const app = await createApplication(nestApp, { name: 'unsynced-ds', user: admin.user });
    const v1 = await seedEditableVersion(app, branchId, /* isSynced */ false);

    // Two workspace (global) data sources: one already pushed to git (synced), one never
    // pushed (unsynced) — the pre-git-enable state. Global DSVs carry the per-branch
    // is_synced flag the git-sync push/pull tracks.
    const syncedDsvId = await makeGlobalDataSource(org.id, branchId, 'synced-ds', /* isSynced */ true);
    const unsyncedDsvId = await makeGlobalDataSource(org.id, branchId, 'unsynced-ds', /* isSynced */ false);

    const syncedDsv = await findEntities(DataSourceVersion, { where: { id: syncedDsvId } });
    const unsyncedDsv = await findEntities(DataSourceVersion, { where: { id: unsyncedDsvId } });
    expect(syncedDsv[0].isSynced).toBe(true);
    expect(unsyncedDsv[0].isSynced).toBe(false);

    // Data-source sync state doesn't gate version creation on the (unsynced) app.
    await authPost(`/api/apps/${app.id}/versions`, cookie, org.id)
      .query({ branch_id: branchId })
      .send({ versionName: 'v2', versionFromId: v1.id })
      .expect(201);

    const drafts = await findEntities(AppVersion, {
      where: { appId: app.id, status: AppVersionStatus.DRAFT, versionType: AppVersionType.VERSION },
    });
    expect(drafts.length).toBeGreaterThanOrEqual(2);
  });

  async function makeGlobalDataSource(
    organizationId: string,
    branchId: string,
    name: string,
    isSynced: boolean
  ): Promise<string> {
    const ds = await saveEntity(DataSource, {
      name,
      kind: 'restapi',
      type: 'default',
      scope: 'global',
      organizationId,
    } as any);
    const dsv = await saveEntity(DataSourceVersion, {
      dataSourceId: ds.id,
      name,
      isActive: true,
      branchId,
      isSynced,
    } as any);
    return dsv.id;
  }
});
