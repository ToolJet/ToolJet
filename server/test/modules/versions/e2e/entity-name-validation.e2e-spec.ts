import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  createDataSource,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

/**
 * Entity-name validation at the API boundary (DataQueriesService + ComponentsService).
 *
 * Query and component names are referenced by name in expressions ({{queries.<name>}},
 * {{components.<name>}}), so they must be valid identifiers and unique. The editor enforces
 * this on rename (validateQueryName / validateComponentName in frontend/src/_helpers/utils.js
 * and Inspector.jsx), but non-UI clients — MCP/PAT tokens, the public API — call these
 * controllers directly. A name with spaces/special characters, or a duplicate, then persists
 * and silently breaks reference resolution for the whole app.
 *
 * Route-level on purpose: each case drives the real HTTP -> guard -> service pipeline. Query
 * name uniqueness was already enforced server-side (advisory-locked assertUniqueQueryName) —
 * covered here as a regression guard — while name *format* (queries) and name format +
 * per-page uniqueness (components) are the newly closed gaps. A fresh app per test keeps state
 * deterministic. The bulk import path saves rows via the EntityManager and does not pass
 * through these service methods, so it is intentionally untouched.
 *
 * @group platform
 */
describe('Entity names are validated via the API', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];
  let user: { id: string; organizationId: string };

  let appId: string;
  let version: AppVersion;
  let homePageId: string;
  let dataSourceId: string;

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  const createQuery = (name: string) =>
    asAdmin(agent().post(`/api/data-queries/data-sources/${dataSourceId}/versions/${version.id}`)).send({
      kind: 'restapi',
      name,
      options: {},
    });

  const renameQuery = (queryId: string, name: string) =>
    asAdmin(agent().patch(`/api/data-queries/${queryId}/versions/${version.id}`)).send({ name });

  const componentEntry = (name: string) => ({
    name,
    type: 'Button',
    layouts: {
      desktop: { top: 10, left: 5, width: 10, height: 40 },
      mobile: { top: 10, left: 5, width: 10, height: 40 },
    },
    general: {},
    generalStyles: {},
    others: {},
    properties: { text: { value: 'Button' } },
    styles: {},
    validation: {},
    parent: null,
  });

  const createComponents = (diff: Record<string, unknown>) =>
    asAdmin(agent().post(`/api/v2/apps/${appId}/versions/${version.id}/components`)).send({
      is_user_switched_version: false,
      pageId: homePageId,
      diff,
    });

  const renameComponent = (componentId: string, name: string) =>
    asAdmin(agent().put(`/api/v2/apps/${appId}/versions/${version.id}/components`)).send({
      is_user_switched_version: false,
      pageId: homePageId,
      diff: { [componentId]: { component: { name } } },
    });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const admin = await createAdmin(nestApp, 'entity-name-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
    user = admin.user;
  });

  beforeEach(async () => {
    const application = await createApplication(nestApp, { name: `entity-name-${uuidv4()}`, user });
    appId = application.id;
    version = await createApplicationVersion(nestApp, application as App & { organizationId: string }, { name: 'v1' });
    homePageId = version.homePageId;
    await updateEntity(AppVersion, version.id, { status: AppVersionStatus.DRAFT });
    const dataSource = await createDataSource(nestApp, {
      appVersion: version,
      kind: 'restapi',
      name: `ds-${uuidv4()}`,
    });
    dataSourceId = dataSource.id;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('query names', () => {
    it('rejects creating a query whose name has invalid characters', async () => {
      const res = await createQuery('my query!');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Query name can only contain');
    });

    it('accepts creating a query with a valid name', async () => {
      const res = await createQuery('getUsers_1');
      expect(res.status).toBe(201);
    });

    it('rejects creating a query whose name duplicates an existing query (already enforced)', async () => {
      expect((await createQuery('duplicateQuery')).status).toBe(201);

      const res = await createQuery('duplicateQuery');
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body)).toContain('already exists');
    });

    it('rejects renaming a query to an invalid name', async () => {
      const created = await createQuery('renameTarget');
      expect(created.status).toBe(201);

      const res = await renameQuery(created.body.id, 'bad name');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Query name can only contain');
    });
  });

  describe('component names', () => {
    it('rejects creating a component whose name has invalid characters', async () => {
      const res = await createComponents({ [uuidv4()]: componentEntry('my button!') });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('can only contain letters, numbers, hyphens and underscores');
    });

    it('accepts creating a component with a valid name', async () => {
      const res = await createComponents({ [uuidv4()]: componentEntry('submitButton1') });
      expect(res.status).toBe(201);
    });

    it('rejects a batch that reuses the same component name twice', async () => {
      const res = await createComponents({
        [uuidv4()]: componentEntry('dupButton'),
        [uuidv4()]: componentEntry('dupButton'),
      });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('used more than once');
    });

    it('rejects a component whose name already exists on the page', async () => {
      expect((await createComponents({ [uuidv4()]: componentEntry('existingButton') })).status).toBe(201);

      const res = await createComponents({ [uuidv4()]: componentEntry('existingButton') });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('already exists on this page');
    });
  });

  describe('component rename', () => {
    it('rejects renaming a component to an invalid name', async () => {
      const componentId = uuidv4();
      expect((await createComponents({ [componentId]: componentEntry('renameMe') })).status).toBe(201);

      const res = await renameComponent(componentId, 'bad name');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('can only contain letters, numbers, hyphens and underscores');
    });

    it('rejects renaming a component to a name already used on the page', async () => {
      expect((await createComponents({ [uuidv4()]: componentEntry('takenName') })).status).toBe(201);
      const otherId = uuidv4();
      expect((await createComponents({ [otherId]: componentEntry('otherName') })).status).toBe(201);

      const res = await renameComponent(otherId, 'takenName');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('already exists on this page');
    });

    it('allows renaming a component to a valid, unused name', async () => {
      const componentId = uuidv4();
      expect((await createComponents({ [componentId]: componentEntry('beforeRename') })).status).toBe(201);

      const res = await renameComponent(componentId, 'afterRename');
      expect(res.status).toBe(200);
    });
  });

  describe('app slug', () => {
    const setSlug = (slug: string) => asAdmin(agent().put(`/api/apps/${appId}`)).send({ app: { slug } });

    it('rejects a slug with invalid characters', async () => {
      const res = await setSlug('bad slug!');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('lowercase letters, numbers and hyphens');
    });

    it('rejects a slug with uppercase letters', async () => {
      const res = await setSlug('MyApp');
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('lowercase letters, numbers and hyphens');
    });

    it('accepts a valid slug', async () => {
      const res = await setSlug(`valid-slug-${uuidv4().slice(0, 8)}`);
      expect(res.status).toBe(200);
    });
  });
});
