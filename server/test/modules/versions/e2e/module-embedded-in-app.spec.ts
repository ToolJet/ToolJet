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
  findEntityOrFail,
  markVersionAsReleased,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { ResourceType } from '@modules/group-permissions/constants';

/**
 * A builder with no standalone module permission must still be able to VIEW a
 * module's version when it's embedded (via a ModuleViewer component) in a
 * regular app the builder can edit. Repro: GET /api/v2/apps/module/by-correlation/
 * :coRelationId/version 403'd unconditionally for builders before this fix,
 * because defineAppVersionAbility only checked standalone module permissions.
 */
/** @group platform */
describe('Module embedded-in-editable-app view access', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  async function embedModuleInApp(consumerVersionId: string, moduleCoRelationId: string) {
    const homePage = await findEntityOrFail(Page, { appVersionId: consumerVersionId } as any);

    await saveEntity(Component, {
      name: 'module1',
      type: 'ModuleViewer',
      pageId: homePage.id,
      properties: {
        moduleAppId: { value: moduleCoRelationId },
        moduleVersionId: { value: '' },
      },
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as any);
  }

  async function fetchModuleVersion(coRelationId: string, cookie: string[], orgId: string, parentAppId?: string) {
    const parentAppParam = parentAppId ? `&parentAppId=${parentAppId}` : '';
    return request(nestApp.getHttpServer())
      .get(`/api/v2/apps/module/by-correlation/${coRelationId}/version?mode=view${parentAppParam}`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie);
  }

  it('allows a builder with no module permission to view the module when embedded in an editable, unreleased (draft) app', async () => {
    const adminData = await createUser(nestApp, { email: 'meia-admin@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;

    // Module owned by admin — the builder below gets NO module grant on it.
    const moduleApp = await createApplication(nestApp, { name: 'M-Embedded', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    await createApplicationVersion(nestApp, moduleApp as any);

    // Builder, with edit access to a consumer app that embeds the module. The consumer
    // app is deliberately left UNRELEASED (no currentVersionId) — this is the common case
    // (a builder embeds a module while still building the app) and must still work.
    const builderData = await createUser(nestApp, {
      email: 'meia-builder@tooljet.io',
      groups: ['builder'],
      organization: org,
    });
    const builderCookie = (await login(nestApp, 'meia-builder@tooljet.io')).tokenCookie;
    const consumerApp = await createApplication(nestApp, {
      name: 'Consumer',
      user: builderData.user,
      type: 'front-end',
    });
    const consumerVersion = await createApplicationVersion(nestApp, consumerApp as any);
    await embedModuleInApp(consumerVersion.id, coRelationId);

    const res = await fetchModuleVersion(coRelationId, builderCookie, org.id, consumerApp.id);
    expect(res.statusCode).toBe(200);
  });

  it('also allows it when the consumer app HAS been released', async () => {
    const adminData = await createUser(nestApp, { email: 'meia-admin5@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;

    const moduleApp = await createApplication(nestApp, { name: 'M-Embedded-Released', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    await createApplicationVersion(nestApp, moduleApp as any);

    const builderData = await createUser(nestApp, {
      email: 'meia-builder5@tooljet.io',
      groups: ['builder'],
      organization: org,
    });
    const builderCookie = (await login(nestApp, 'meia-builder5@tooljet.io')).tokenCookie;
    const consumerApp = await createApplication(nestApp, {
      name: 'Consumer Released',
      user: builderData.user,
      type: 'front-end',
    });
    const consumerVersion = await createApplicationVersion(nestApp, consumerApp as any);
    await markVersionAsReleased(consumerApp.id, consumerVersion.id);
    await embedModuleInApp(consumerVersion.id, coRelationId);

    const res = await fetchModuleVersion(coRelationId, builderCookie, org.id, consumerApp.id);
    expect(res.statusCode).toBe(200);
  });

  it('403s the same builder without parentAppId (baseline repro)', async () => {
    const adminData = await createUser(nestApp, { email: 'meia-admin2@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;

    const moduleApp = await createApplication(nestApp, { name: 'M-Bare', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    await createApplicationVersion(nestApp, moduleApp as any);

    const builderData = await createUser(nestApp, {
      email: 'meia-builder2@tooljet.io',
      groups: ['builder'],
      organization: org,
    });
    const builderCookie = (await login(nestApp, 'meia-builder2@tooljet.io')).tokenCookie;
    void builderData;

    const res = await fetchModuleVersion(coRelationId, builderCookie, org.id);
    expect(res.statusCode).toBe(403);
  });

  it('403s when parentAppId points to an app the builder can edit but does NOT embed the module (anti-spoof)', async () => {
    const adminData = await createUser(nestApp, { email: 'meia-admin3@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;

    const moduleApp = await createApplication(nestApp, { name: 'M-Unembedded', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    await createApplicationVersion(nestApp, moduleApp as any);

    const builderData = await createUser(nestApp, {
      email: 'meia-builder3@tooljet.io',
      groups: ['builder'],
      organization: org,
    });
    const builderCookie = (await login(nestApp, 'meia-builder3@tooljet.io')).tokenCookie;
    // Builder owns this app (so it's editable) but it does NOT embed the module.
    const consumerApp = await createApplication(nestApp, {
      name: 'Empty Consumer',
      user: builderData.user,
      type: 'front-end',
    });
    const consumerVersion = await createApplicationVersion(nestApp, consumerApp as any);
    await markVersionAsReleased(consumerApp.id, consumerVersion.id);

    const res = await fetchModuleVersion(coRelationId, builderCookie, org.id, consumerApp.id);
    expect(res.statusCode).toBe(403);
  });

  it('403s when parentAppId embeds the module but the builder cannot edit that app', async () => {
    const adminData = await createUser(nestApp, { email: 'meia-admin4@tooljet.io', groups: ['all_users', 'admin'] });
    const org = adminData.organization;

    const moduleApp = await createApplication(nestApp, { name: 'M-NotYours', user: adminData.user, type: 'module' });
    const coRelationId = uuidv4();
    await updateEntity(App, moduleApp.id, { co_relation_id: coRelationId } as any);
    await createApplicationVersion(nestApp, moduleApp as any);

    // Consumer app is owned by ADMIN, not the builder — builder has no edit grant on it.
    const consumerApp = await createApplication(nestApp, {
      name: 'Admin Consumer',
      user: adminData.user,
      type: 'front-end',
    });
    const consumerVersion = await createApplicationVersion(nestApp, consumerApp as any);
    await markVersionAsReleased(consumerApp.id, consumerVersion.id);
    await embedModuleInApp(consumerVersion.id, coRelationId);

    const builderData = await createUser(nestApp, {
      email: 'meia-builder4@tooljet.io',
      groups: ['builder'],
      organization: org,
    });
    const builderCookie = (await login(nestApp, 'meia-builder4@tooljet.io')).tokenCookie;
    void builderData;

    // The default 'builder' group's own APP granular permission grants isAll (edit-all
    // apps) by default — real product behavior for CE. Narrow it to isAll:false so this
    // builder genuinely has no edit grant on `consumerApp`, exercising the "editable
    // check fails" branch instead of always taking the isAllEditable shortcut.
    const builderGroup = await findEntityOrFail(GroupPermissions, { name: 'builder', organizationId: org.id } as any);
    const builderAppGranular = await findEntityOrFail(GranularPermissions, {
      groupId: builderGroup.id,
      type: ResourceType.APP,
    } as any);
    await updateEntity(GranularPermissions, builderAppGranular.id, { isAll: false } as any);

    const res = await fetchModuleVersion(coRelationId, builderCookie, org.id, consumerApp.id);
    expect(res.statusCode).toBe(403);
  });
});
