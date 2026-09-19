import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  saveEntity,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';

/**
 * Module-in-module prevention at the API boundary (ComponentsService.createComponentsAndLayouts).
 *
 * The editor hides the Modules palette while editing a module, so the UI can't drop a ModuleViewer
 * into a module. Non-UI clients (MCP/PAT tokens, the public API) call POST .../components directly
 * and bypass that client-side guard — the backend must reject the nested ModuleViewer itself, or the
 * invalid data persists and later surfaces as "Module not found" when the embedded reference fails to
 * resolve (the nested module is never bundled on export/import).
 *
 * Route-level on purpose: this drives the real HTTP → guard → service pipeline against a genuine
 * module-type app (App.type = 'module' with a ModuleContainer on its home page), the exact production
 * shape resolveModuleContainerId keys off. A Button control proves module apps still accept ordinary
 * components — the block is ModuleViewer-specific, not a blanket rejection.
 *
 * @group platform
 */
describe('Module structural integrity (via the API)', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];

  let moduleAppId: string;
  let moduleVersion: AppVersion;
  let homePageId: string;
  let moduleContainerId: string;

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  const componentDiff = (type: 'ModuleViewer' | 'Button', id: string = uuidv4()) => ({
    [id]: {
      name: `${type.toLowerCase()}${uuidv4().slice(0, 8)}`,
      type,
      layouts: {
        desktop: { top: 10, left: 5, width: 10, height: 40 },
        mobile: { top: 10, left: 5, width: 10, height: 40 },
      },
      general: {},
      generalStyles: {},
      others: {},
      properties:
        type === 'ModuleViewer'
          ? { moduleAppId: { value: '' }, moduleVersionId: { value: '' } }
          : { text: { value: 'Button' } },
      styles: {},
      validation: {},
      parent: null,
    },
  });

  const postComponent = (versionId: string, pageId: string, type: 'ModuleViewer' | 'Button') =>
    asAdmin(agent().post(`/api/v2/apps/${moduleAppId}/versions/${versionId}/components`)).send({
      is_user_switched_version: false,
      pageId,
      diff: componentDiff(type),
    });

  const deleteComponents = (versionId: string, pageId: string, ids: string[]) =>
    asAdmin(agent().delete(`/api/v2/apps/${moduleAppId}/versions/${versionId}/components`)).send({
      is_user_switched_version: false,
      pageId,
      diff: ids,
    });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

    const admin = await createAdmin(nestApp, 'module-nesting-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;

    // A module-type app: resolveModuleContainerId only returns a container (and the nested-module
    // check only fires) when App.type === 'module'.
    const moduleApp = await createApplication(nestApp, {
      name: 'nesting-module',
      user: admin.user,
      type: 'module',
    });
    moduleAppId = moduleApp.id;

    moduleVersion = await createApplicationVersion(nestApp, moduleApp as App & { organizationId: string }, {
      name: 'v1',
    });
    homePageId = moduleVersion.homePageId;

    // The seed helper leaves status null; assertVersionEditable (GitSyncEditGuard) rejects any
    // non-DRAFT status before the request reaches the service, so make the version editable.
    await updateEntity(AppVersion, moduleVersion.id, { status: AppVersionStatus.DRAFT });

    // A module app's root ModuleContainer — auto-created by the real module-create flow; seed it
    // directly so resolveModuleContainerId finds it on the home page.
    moduleContainerId = uuidv4();
    await saveEntity(Component, {
      id: moduleContainerId,
      name: 'moduleContainer1',
      type: 'ModuleContainer',
      pageId: homePageId,
      properties: {},
      styles: {},
      general: {},
      generalStyles: {},
      validation: {},
    } as Partial<Component>);
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('a module cannot contain another module', () => {
    it('rejects adding a ModuleViewer to a module-type app', async () => {
      const res = await postComponent(moduleVersion.id, homePageId, 'ModuleViewer');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('module cannot contain another module');
    });

    it('still allows ordinary components (Button) in a module-type app — the block is ModuleViewer-specific', async () => {
      const res = await postComponent(moduleVersion.id, homePageId, 'Button');
      expect(res.status).toBe(201);
    });
  });

  describe('the module container (module root) cannot be deleted', () => {
    it('rejects deleting the ModuleContainer', async () => {
      const res = await deleteComponents(moduleVersion.id, homePageId, [moduleContainerId]);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('module container cannot be deleted');
    });

    it('allows deleting a regular component — the block is specific to the module container', async () => {
      const buttonId = uuidv4();
      const created = await asAdmin(
        agent().post(`/api/v2/apps/${moduleAppId}/versions/${moduleVersion.id}/components`)
      ).send({
        is_user_switched_version: false,
        pageId: homePageId,
        diff: componentDiff('Button', buttonId),
      });
      expect(created.status).toBe(201);

      const res = await deleteComponents(moduleVersion.id, homePageId, [buttonId]);
      expect(res.status).toBe(200);
    });
  });
});
