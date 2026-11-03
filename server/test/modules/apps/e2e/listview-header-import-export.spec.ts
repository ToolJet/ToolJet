/**
 * ListView 2.0 header (Listview-HDR-007): a ListView's header is the slot canvas `<listviewId>-header`.
 * Export then import gives every component a new id, so the header child must come back parented to
 * `<new listview id>-header`, with the header keys kept.
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  closeTestApp,
  saveEntity,
  findEntities,
  findEntityOrFail,
} from 'test-helper';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';

describe('ListView header export and import', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  it('[Listview-HDR-007] a header component and the header keys round-trip through export and import', async () => {
    // Break this catches: the import remapping a header child's parent to the bare new ListView id (or
    // dropping it), which moves the header child into the records; or a header key lost on the way.
    const admin = await createAdmin(app, 'admin@tooljet.io');
    const source = await createApplication(app, { name: 'listview-header-app', user: admin.user as any });
    const version = await createApplicationVersion(app, source as any);
    const page = await findEntityOrFail(Page, { appVersionId: version.id } as any);
    const blank = { general: {}, generalStyles: {}, validation: {} };
    const listview = await saveEntity(Component, {
      ...blank,
      name: 'listview1',
      type: 'Listview',
      pageId: page.id,
      properties: {
        data: { value: "{{[{ text: 'a' }]}}" },
        showHeader: { value: '{{true}}' },
      },
      styles: {
        listStyle: { value: 'bordered' },
        headerBackgroundColor: { value: 'var(--cc-surface2-surface)' },
        headerDividerColor: { value: 'var(--cc-default-border)' },
      },
    } as any);
    await saveEntity(Component, {
      ...blank,
      name: 'title1',
      type: 'Text',
      pageId: page.id,
      parent: `${listview.id}-header`,
      properties: { text: { value: 'Orders' } },
      styles: {},
    } as any);
    await saveEntity(Component, {
      ...blank,
      name: 'text1',
      type: 'Text',
      pageId: page.id,
      parent: listview.id,
      properties: { text: { value: '{{listItem.text}}' } },
      styles: {},
    } as any);

    const exported = await request(app.getHttpServer())
      .post('/api/v2/resources/export')
      .set('tj-workspace-id', admin.user.defaultOrganizationId)
      .set('Cookie', admin.cookie)
      .send({ app: [{ id: source.id }], organization_id: admin.user.defaultOrganizationId })
      .expect(201);
    const imported = await request(app.getHttpServer())
      .post('/api/v2/resources/import')
      .set('tj-workspace-id', admin.user.defaultOrganizationId)
      .set('Cookie', admin.cookie)
      .send({
        organization_id: admin.user.defaultOrganizationId,
        tooljet_version: exported.body.tooljet_version,
        app: exported.body.app,
      })
      .expect(201);

    const copyVersion = await findEntityOrFail(AppVersion, { appId: imported.body.imports.app[0].id } as any);
    const copyPage = await findEntityOrFail(Page, { appVersionId: copyVersion.id } as any);
    const components = await findEntities(Component, { where: { pageId: copyPage.id } } as any);
    const byName = (name: string) => components.find((component) => component.name === name);

    const importedListview = byName('listview1');
    expect(importedListview.id).not.toBe(listview.id);
    expect(byName('title1').parent).toBe(`${importedListview.id}-header`);
    expect(byName('text1').parent).toBe(importedListview.id);
    expect(importedListview.properties.showHeader).toEqual({ value: '{{true}}' });
    expect(importedListview.styles.headerBackgroundColor).toEqual({ value: 'var(--cc-surface2-surface)' });
    expect(importedListview.styles.headerDividerColor).toEqual({ value: 'var(--cc-default-border)' });
  });
});
