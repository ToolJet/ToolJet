import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the container registers the EE subclass
// (server/ee/apps/services/page.service.ts) — app.get() matches by class reference.
import { PageService } from '@ee/apps/services/page.service';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { Layout } from '@entities/layout.entity';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  findEntityOrFail,
  findEntities,
  saveEntity,
} from 'test-helper';

const SOURCE_COMPONENT_GIT_ID = '11111111-1111-4111-8111-111111111111';
const SOURCE_LAYOUT_GIT_ID = '22222222-2222-4222-8222-222222222222';
const SOURCE_CREATED_AT = new Date('2020-01-01T00:00:00.000Z');

/** @group platform */
describe('PageService.clonePage — cloned entity identity', () => {
  let app: INestApplication;

  let sourceComponent: Component;
  let clonedComponent: Component;
  let clonedLayout: Layout;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const pageService = app.get(PageService);

    const admin = await createAdmin(app, 'clone-page-identity-admin@tooljet.io');
    const application = await createApplication(app, { name: 'clone-page-identity-app', user: admin.user });
    const version = await createApplicationVersion(app, application as any);
    const sourcePage = await findEntityOrFail(Page, { appVersionId: version.id });

    sourceComponent = await saveEntity(Component, {
      name: 'table1',
      type: 'Table',
      pageId: sourcePage.id,
      parent: null,
      properties: { serverSidePagination: { value: '{{false}}' } },
      styles: { visibility: { value: '{{true}}' } },
      validation: {},
      general: {},
      generalStyles: {},
      displayPreferences: {},
      // A pushed app carries git identity on every component; the clone must not inherit it.
      co_relation_id: SOURCE_COMPONENT_GIT_ID,
      createdAt: SOURCE_CREATED_AT,
    });

    await saveEntity(Layout, {
      componentId: sourceComponent.id,
      type: 'desktop',
      top: 80,
      left: 7,
      width: 25,
      height: 460,
      dimensionUnit: 'count',
      co_relation_id: SOURCE_LAYOUT_GIT_ID,
    });

    await pageService.clonePage(sourcePage.id, version.id, admin.workspace.id);

    const clonedPage = await findEntityOrFail(Page, { appVersionId: version.id, handle: 'home-copy' });
    [clonedComponent] = await findEntities(Component, { where: { pageId: clonedPage.id } });
    [clonedLayout] = await findEntities(Layout, { where: { componentId: clonedComponent.id } });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should give the cloned component an identity of its own, not the source component’s', () => {
    expect(clonedComponent.id).not.toEqual(sourceComponent.id);
    expect(clonedComponent.co_relation_id).toBeNull();
    expect(clonedComponent.createdAt.getTime()).toBeGreaterThan(SOURCE_CREATED_AT.getTime());
  });

  it('should leave the source component’s identity untouched', async () => {
    const source = await findEntityOrFail(Component, { id: sourceComponent.id });
    expect(source.co_relation_id).toEqual(SOURCE_COMPONENT_GIT_ID);
  });

  it('should give the cloned layout an identity of its own while preserving position and size', () => {
    expect(clonedLayout.co_relation_id).toBeNull();
    expect(clonedLayout).toMatchObject({
      type: 'desktop',
      top: 80,
      left: 7,
      width: 25,
      height: 460,
      dimensionUnit: 'count',
    });
  });

  it('should copy the component content so the clone renders the same', () => {
    expect(clonedComponent).toMatchObject({
      name: sourceComponent.name,
      type: sourceComponent.type,
      properties: sourceComponent.properties,
      styles: sourceComponent.styles,
    });
  });
});
