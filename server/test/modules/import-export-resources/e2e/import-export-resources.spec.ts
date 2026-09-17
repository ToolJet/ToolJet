/**
 * Import/Export Resources E2E Tests
 *
 * Verifies the v2 import/export/clone endpoints:
 *   POST /api/v2/resources/export | export apps
 *   POST /api/v2/resources/import | import apps (round-trip)
 *   POST /api/v2/resources/clone  | clone an app
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  createAdmin,
  createEndUser,
  createApplication,
  createApplicationVersion,
  closeTestApp,
  saveEntity,
  updateEntity,
  findEntity,
  findEntities,
  findEntityOrFail,
  countEntities,
  resolveOrSeedDefaultBranch,
  getDefaultDataSource,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('ImportExportResourcesController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Creates an app with a version, ready for export/clone operations. */
    async function seedApp(admin: Awaited<ReturnType<typeof createAdmin>>) {
      const application = await createApplication(app, {
        name: 'export-test-app',
        user: admin.user as any,
      });
      await createApplicationVersion(app, application as any);
      return application;
    }

    /** Minimal git config so getDetails() resolves the workspace as git-enabled. No live git
     * is touched — import only writes DB rows. */
    async function enableGitSync(organizationId: string) {
      const orgGitSync = await saveEntity(OrganizationGitSync, {
        organizationId,
        autoCommit: false,
        isBranchingEnabled: true,
      } as any);
      await saveEntity(OrganizationGitHttps, {
        configId: orgGitSync.id,
        httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
        githubBranch: 'main',
        githubAppId: 'test-app-id',
        githubInstallationId: 'test-installation-id',
        githubPrivateKey: 'dummy-key-not-dereferenced',
        isEnabled: true,
        isFinalized: true,
      } as any);
      await resolveOrSeedDefaultBranch(organizationId);
    }

    /** Seed a non-default (feature) WorkspaceBranch so imports can target it. */
    async function createFeatureBranch(organizationId: string, name: string): Promise<WorkspaceBranch> {
      const defaultBranch = await resolveOrSeedDefaultBranch(organizationId);
      return saveEntity(WorkspaceBranch, {
        organizationId,
        name,
        isDefault: false,
        sourceBranchId: defaultBranch.id,
      } as any);
    }

    type Admin = Awaited<ReturnType<typeof createAdmin>>;

    async function exportApp(admin: Admin, appId: string, branchId?: string) {
      const query = branchId ? `?branch_id=${branchId}` : '';
      const res = await request(app.getHttpServer())
        .post(`/api/v2/resources/export${query}`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({ app: [{ id: appId }], organization_id: admin.user.defaultOrganizationId })
        .expect(201);
      return res.body;
    }

    async function importPayload(admin: Admin, exportBody: any, appName: string, branchId?: string) {
      const query = branchId ? `?branch_id=${branchId}` : '';
      const res = await request(app.getHttpServer())
        .post(`/api/v2/resources/import${query}`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({
          organization_id: admin.user.defaultOrganizationId,
          tooljet_version: exportBody.tooljet_version,
          app: exportBody.app.map((a: any) => ({ ...a, appName })),
          ...(branchId && { branchId }),
        });
      if (res.status !== 201) {
        // Surface the reason (e.g. license / branch gate) instead of a bare status.
        throw new Error(`import failed: ${res.status} ${JSON.stringify(res.body)}`);
      }
      return res.body;
    }

    /** Create a module app (with a co_relation_id) + a front-end consumer app whose home page
     * embeds it via a ModuleViewer. Returns both so exports carry the module. */
    async function seedModuleAndConsumer(admin: Admin) {
      const moduleApp = await createApplication(app, {
        name: 'shared-module',
        user: admin.user as any,
        type: 'module',
      } as any);
      const moduleCoRelationId = uuidv4();
      await updateEntity(App, moduleApp.id, { co_relation_id: moduleCoRelationId } as any);
      await createApplicationVersion(app, moduleApp as any);

      const consumerApp = await createApplication(app, {
        name: 'module-consumer',
        user: admin.user as any,
        type: 'front-end',
      } as any);
      const consumerVersion = await createApplicationVersion(app, consumerApp as any);
      const homePage = await findEntityOrFail(Page, { appVersionId: consumerVersion.id } as any);
      await saveEntity(Component, {
        name: 'moduleviewer1',
        type: 'ModuleViewer',
        pageId: homePage.id,
        properties: { moduleAppId: { value: moduleCoRelationId }, moduleVersionId: { value: '' } },
        general: {},
        styles: {},
        generalStyles: {},
        validation: {},
      } as any);
      return { consumerApp, moduleCoRelationId };
    }

    /** All ModuleViewer moduleAppId values across the org's front-end apps. */
    async function moduleViewerRefs(organizationId: string): Promise<string[]> {
      const rows: Array<{ mid: string }> = await getDefaultDataSource().query(
        `SELECT c.properties->'moduleAppId'->>'value' AS mid
           FROM components c
           JOIN pages p ON p.id = c.page_id
           JOIN app_versions av ON av.id = p.app_version_id
           JOIN apps a ON a.id = av.app_id
          WHERE a.organization_id = $1 AND a.type = 'front-end' AND c.type = 'ModuleViewer'`,
        [organizationId]
      );
      return rows.map((r) => r.mid);
    }

    describe('POST /api/v2/resources/export | export apps', () => {
      it('should allow an admin to export an app (201)', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const application = await seedApp(admin);

        const response = await request(app.getHttpServer())
          .post('/api/v2/resources/export')
          .set('tj-workspace-id', admin.user.defaultOrganizationId)
          .set('Cookie', admin.cookie)
          .send({
            app: [{ id: application.id }],
            organization_id: admin.user.defaultOrganizationId,
          })
          .expect(201);

        expect(response.body).toHaveProperty('app');
        expect(Array.isArray(response.body.app)).toBe(true);
        expect(response.body.app.length).toEqual(1);
        expect(response.body).toHaveProperty('tooljet_version');
      });

      it('should deny export for an end-user (403)', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const application = await seedApp(admin);
        const endUser = await createEndUser(app, 'viewer@tooljet.io', {
          workspace: admin.workspace,
        });

        await request(app.getHttpServer())
          .post('/api/v2/resources/export')
          .set('tj-workspace-id', endUser.user.defaultOrganizationId)
          .set('Cookie', endUser.cookie)
          .send({
            app: [{ id: application.id }],
            organization_id: endUser.user.defaultOrganizationId,
          })
          .expect(403);
      });
    });

    describe('POST /api/v2/resources/import | import apps (round-trip)', () => {
      it('should allow an admin to import an exported payload (round-trip)', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const application = await seedApp(admin);

        // Export first
        const exportResponse = await request(app.getHttpServer())
          .post('/api/v2/resources/export')
          .set('tj-workspace-id', admin.user.defaultOrganizationId)
          .set('Cookie', admin.cookie)
          .send({
            app: [{ id: application.id }],
            organization_id: admin.user.defaultOrganizationId,
          })
          .expect(201);

        // Import the exported payload back
        const importResponse = await request(app.getHttpServer())
          .post('/api/v2/resources/import')
          .set('tj-workspace-id', admin.user.defaultOrganizationId)
          .set('Cookie', admin.cookie)
          .send({
            organization_id: admin.user.defaultOrganizationId,
            tooljet_version: exportResponse.body.tooljet_version,
            app: exportResponse.body.app,
          })
          .expect(201);

        expect(importResponse.body).toHaveProperty('imports');
        expect(importResponse.body.success).toBe(true);
      });
    });

    describe('POST /api/v2/resources/clone | clone an app', () => {
      it('should allow an admin to clone an app', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const application = await seedApp(admin);

        const response = await request(app.getHttpServer())
          .post('/api/v2/resources/clone')
          .set('tj-workspace-id', admin.user.defaultOrganizationId)
          .set('Cookie', admin.cookie)
          .send({
            app: [{ id: application.id, name: 'cloned-app' }],
            organization_id: admin.user.defaultOrganizationId,
          })
          .expect(201);

        expect(response.body).toHaveProperty('imports');
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/v2/resources/import | branch-draft version naming', () => {
      it('git NOT enabled → the imported version keeps its input name (not a UUID)', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const application = await seedApp(admin);

        const exportBody = await exportApp(admin, application.id);
        const inputName: string = exportBody.app[0].definition.appV2.appVersions[0].name;

        const imports = await importPayload(admin, exportBody, 'imported-nogit');
        const importedId: string = imports.imports.app[0].id;

        const versions = await findEntities(AppVersion, { where: { appId: importedId } } as any);
        expect(versions).toHaveLength(1);
        expect(versions[0].name).toBe(inputName);
        expect(versions[0].name).not.toMatch(UUID_RE);
      });

      it('git enabled + feature branch → the imported branch draft gets a random UUID name', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        await enableGitSync(admin.user.defaultOrganizationId);
        const feat = await createFeatureBranch(admin.user.defaultOrganizationId, 'feat-naming');
        const application = await seedApp(admin);

        const exportBody = await exportApp(admin, application.id);
        const inputName: string = exportBody.app[0].definition.appV2.appVersions[0].name;

        const imports = await importPayload(admin, exportBody, 'imported-git', feat.id);
        const importedId: string = imports.imports.app[0].id;

        const versions = await findEntities(AppVersion, { where: { appId: importedId } } as any);
        const branchVersion = versions.find((v) => v.versionType === 'branch');
        expect(branchVersion).toBeDefined();
        expect(branchVersion!.branchId).toBe(feat.id);
        expect(branchVersion!.name).not.toBe(inputName);
        expect(branchVersion!.name).toMatch(UUID_RE);
      });
    });

    describe('POST /api/v2/resources/import | module connection & reuse', () => {
      it('single branch: importing a file that embeds a module connects it, and re-import with a different app name reuses the same module', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const orgId = admin.user.defaultOrganizationId;
        const { consumerApp, moduleCoRelationId } = await seedModuleAndConsumer(admin);

        const exportBody = await exportApp(admin, consumerApp.id);
        // The export must carry the embedded module for the import to reconnect it.
        expect(exportBody.app[0].definition.appV2.modules?.length).toBeGreaterThan(0);

        const moduleCountBefore = await countEntities(App, { organizationId: orgId, type: 'module' } as any);

        await importPayload(admin, exportBody, 'consumer-copy-1');
        await importPayload(admin, exportBody, 'consumer-copy-2'); // different app name

        // Both imports reuse the existing module — no duplicate module app created.
        const moduleCountAfter = await countEntities(App, { organizationId: orgId, type: 'module' } as any);
        expect(moduleCountAfter).toBe(moduleCountBefore);

        // The module identity survives, and every consumer's ModuleViewer points at it (connected).
        const moduleApp = await findEntity(App, { co_relation_id: moduleCoRelationId, type: 'module' } as any);
        expect(moduleApp).toBeTruthy();
        const refs = await moduleViewerRefs(orgId);
        expect(refs.length).toBeGreaterThanOrEqual(3); // seed consumer + 2 imports
        expect(refs.every((r) => r === moduleCoRelationId)).toBe(true);
      });

      it('multi branch: on a feature branch, import connects the module and re-import (different name) reuses it', async () => {
        const admin = await createAdmin(app, 'admin@tooljet.io');
        const orgId = admin.user.defaultOrganizationId;
        await enableGitSync(orgId);
        const feat = await createFeatureBranch(orgId, 'feat-module');
        const { consumerApp, moduleCoRelationId } = await seedModuleAndConsumer(admin);

        const exportBody = await exportApp(admin, consumerApp.id);
        expect(exportBody.app[0].definition.appV2.modules?.length).toBeGreaterThan(0);

        const moduleCountBefore = await countEntities(App, { organizationId: orgId, type: 'module' } as any);

        await importPayload(admin, exportBody, 'branch-consumer-1', feat.id);
        await importPayload(admin, exportBody, 'branch-consumer-2', feat.id);

        const moduleCountAfter = await countEntities(App, { organizationId: orgId, type: 'module' } as any);
        expect(moduleCountAfter).toBe(moduleCountBefore);

        const moduleApp = await findEntity(App, { co_relation_id: moduleCoRelationId, type: 'module' } as any);
        expect(moduleApp).toBeTruthy();
        const refs = await moduleViewerRefs(orgId);
        expect(refs.every((r) => r === moduleCoRelationId)).toBe(true);
      });
    });
  });
});
