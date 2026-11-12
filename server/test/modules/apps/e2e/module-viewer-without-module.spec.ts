/**
 * An app holding a ModuleViewer saved without a module (properties {}, as tooljet-mcp's add_components wrote one)
 * failed every load with 500 "Cannot read properties of undefined (reading 'value')", and its export with it
 * (QA DVRL-1). The ModuleViewer now just has no module to fetch.
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  saveEntity,
  findEntityOrFail,
} from 'test-helper';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { Layout } from '@entities/layout.entity';

describe('App holding a ModuleViewer with no module', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  type Admin = Awaited<ReturnType<typeof createAdmin>>;

  async function seedAppWithEmptyModuleViewer(admin: Admin) {
    const application = await createApplication(nestApp, { name: 'empty-module-viewer', user: admin.user as any });
    const version = await createApplicationVersion(nestApp, application as any);
    const homePage = await findEntityOrFail(Page, { appVersionId: version.id } as any);
    const moduleViewer = await saveEntity(Component, {
      name: 'module1',
      type: 'ModuleViewer',
      pageId: homePage.id,
      properties: {},
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as any);
    await saveEntity(Layout, {
      type: 'desktop',
      top: 20,
      left: 2,
      width: 20,
      height: 200,
      dimensionUnit: 'count',
      componentId: moduleViewer.id,
    } as any);
    return { application, version };
  }

  it('loads its version, as the editor and the viewer do', async () => {
    const admin = await createAdmin(nestApp, 'empty-module-viewer-load@tooljet.io');
    const { application, version } = await seedAppWithEmptyModuleViewer(admin);

    const res = await request(nestApp.getHttpServer())
      .get(`/api/v2/apps/${application.id}/versions/${version.id}`)
      .set('tj-workspace-id', admin.user.defaultOrganizationId)
      .set('Cookie', admin.cookie);

    expect({ status: res.statusCode, message: res.body?.message }).toEqual({ status: 200, message: undefined });
    expect(JSON.stringify(res.body.pages)).toContain('"module1"');
    expect(res.body.modules).toEqual([]);
  });

  it('exports', async () => {
    const admin = await createAdmin(nestApp, 'empty-module-viewer-export@tooljet.io');
    const { application } = await seedAppWithEmptyModuleViewer(admin);

    const res = await request(nestApp.getHttpServer())
      .post('/api/v2/resources/export')
      .set('tj-workspace-id', admin.user.defaultOrganizationId)
      .set('Cookie', admin.cookie)
      .send({ app: [{ id: application.id }], organization_id: admin.user.defaultOrganizationId });

    expect({ status: res.statusCode, message: res.body?.message }).toEqual({ status: 201, message: undefined });
    expect(res.body.app).toHaveLength(1);
  });
});
