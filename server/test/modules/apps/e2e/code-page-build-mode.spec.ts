import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

/**
 * The two build modes never mix. A code page (a top-level pack or library component with `codePage` set) belongs to
 * an app built in Code mode only, and a Code mode app holds nothing else. The editor offers neither; the CLI, MCP and
 * the AI builder write through these routes. Keeping the modes apart is what lets app security and the editor go by
 * apps.build_mode instead of reading components.
 *
 * @group platform
 */
describe('ComponentsController | components and the build mode', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  const rootComponent = (properties: Record<string, unknown>, type = 'LibraryComponent') => ({
    name: `app${Date.now()}`,
    type,
    layouts: {
      desktop: { top: 0, left: 0, width: 43, height: 100 },
      mobile: { top: 0, left: 0, width: 43, height: 100 },
    },
    general: {},
    generalStyles: {},
    others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{true}}' } },
    properties: { visibility: { value: '{{true}}' }, ...properties },
    styles: {},
    validation: {},
    parent: null,
  });

  const seedApp = async (name: string, buildMode: 'visual' | 'code') => {
    const admin = await createAdmin(nestApp, `${name}@tooljet.io`);
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
    const app = await createApplication(nestApp, { name, user: admin.user });
    const version = await createApplicationVersion(nestApp, app as App & { organizationId: string }, { name: 'v1' });
    await updateEntity(AppVersion, version.id, { status: AppVersionStatus.DRAFT });
    await getDefaultDataSource().manager.query('UPDATE apps SET build_mode = $2 WHERE id = $1', [app.id, buildMode]);
    return { appId: app.id, version };
  };

  const create = (appId: string, version: AppVersion, id: string, component: Record<string, unknown>) =>
    asAdmin(
      agent()
        .post(`/api/v2/apps/${appId}/versions/${version.id}/components`)
        .send({ is_user_switched_version: false, pageId: version.homePageId, diff: { [id]: component } })
    );

  const update = (appId: string, version: AppVersion, id: string, properties: Record<string, unknown>) =>
    asAdmin(
      agent()
        .put(`/api/v2/apps/${appId}/versions/${version.id}/components`)
        .send({
          is_user_switched_version: false,
          pageId: version.homePageId,
          diff: { [id]: { component: { definition: { properties } } } },
        })
    );

  const componentCount = async (id: string) =>
    (await getDefaultDataSource().manager.query('SELECT count(*)::int AS n FROM components WHERE id = $1', [id]))[0].n;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('in a visual app', () => {
    let appId: string;
    let version: AppVersion;

    beforeAll(async () => {
      ({ appId, version } = await seedApp('code-page-visual', 'visual'));
    });

    it.each([
      ['LibraryComponent', '{{true}}'],
      ['PackComponent', true],
      ['LibraryComponent', 'true'],
    ])('should refuse to create a %s code page (codePage %p), and store nothing', async (type, flag) => {
      const id = uuidv4();
      const res = await create(appId, version, id, rootComponent({ codePage: { value: flag } }, type));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not built in Code mode/);
      expect(await componentCount(id)).toBe(0);
    });

    it('should refuse to turn an existing library component into a code page', async () => {
      const id = uuidv4();
      expect((await create(appId, version, id, rootComponent({}))).status).toBe(201);
      const res = await update(appId, version, id, { codePage: { value: '{{true}}' } });
      expect(res.status).toBe(400);
      const [row] = await getDefaultDataSource().manager.query(
        "SELECT properties::json -> 'codePage' AS flag FROM components WHERE id = $1",
        [id]
      );
      expect(row.flag).toBeNull();
    });

    it('should still take library components that are not code pages', async () => {
      const id = uuidv4();
      expect((await create(appId, version, id, rootComponent({ codePage: { value: '{{false}}' } }))).status).toBe(201);
      expect((await update(appId, version, id, { componentName: { value: 'Orders' } })).status).toBe(200);
    });
  });

  describe('in a Code mode app', () => {
    let appId: string;
    let version: AppVersion;
    let rootId: string;

    beforeAll(async () => {
      ({ appId, version } = await seedApp('code-page-code', 'code'));
      // Made here, not in a test: each test's writes are rolled back after it.
      rootId = uuidv4();
      expect((await create(appId, version, rootId, rootComponent({ codePage: { value: '{{true}}' } }))).status).toBe(
        201
      );
    });

    it('should take updates to its code page, including ones that do not resend codePage', async () => {
      expect((await update(appId, version, rootId, { codePage: { value: '{{true}}' } })).status).toBe(200);
      expect((await update(appId, version, rootId, { routes: { value: '[]' } })).status).toBe(200);
    });

    it.each([
      ['a visual component', () => ({ ...rootComponent({}), type: 'Button', properties: { text: { value: 'Save' } } })],
      ['a library component that is not a code page', () => rootComponent({ codePage: { value: '{{false}}' } })],
      [
        'a code page inside another component',
        () => ({ ...rootComponent({ codePage: { value: '{{true}}' } }), parent: rootId }),
      ],
    ])('should refuse %s, and store nothing', async (_label, component) => {
      const id = uuidv4();
      const res = await create(appId, version, id, component());
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/built in Code mode/);
      expect(await componentCount(id)).toBe(0);
    });

    it('should refuse to turn its code page into a plain library component', async () => {
      const res = await update(appId, version, rootId, { codePage: { value: '{{false}}' } });
      expect(res.status).toBe(400);
      const [row] = await getDefaultDataSource().manager.query(
        "SELECT properties::json -> 'codePage' ->> 'value' AS flag FROM components WHERE id = $1",
        [rootId]
      );
      expect(row.flag).toBe('{{true}}');
    });
  });
});
