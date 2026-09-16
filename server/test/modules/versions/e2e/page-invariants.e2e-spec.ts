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
import { Page } from '@entities/page.entity';

/**
 * Page invariants at the API boundary (PageService.createPage / updatePage / deletePage).
 *
 * The App Builder enforces these rules client-side — handle format (validateKebabCase in
 * frontend/src/_helpers/utils.js), handle/name uniqueness and the delete guards in
 * frontend/src/AppBuilder/_stores/slices/pageMenuSlice.js, and the home-page toggles in
 * AddNewPagePopup.jsx. Non-UI clients (MCP/PAT tokens, the public API) call these same
 * controllers directly and skip every one of those checks, so a duplicate handle, a
 * broken-format handle, a deleted home/last page, or a hidden/disabled home page can be
 * persisted and later corrupt navigation. The invariants therefore have to hold server-side.
 *
 * Route-level on purpose: each case drives the real HTTP -> guard -> service pipeline against a
 * genuine draft version, so it also proves the rule is wired onto the live routes and not just a
 * unit-testable helper. A fresh app per test keeps page counts deterministic (every version
 * starts with exactly one default home page). The bulk import path saves pages via the
 * EntityManager directly and does not pass through these methods, so it is intentionally untouched.
 *
 * @group platform
 */
describe('Page invariants are enforced via the API', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];
  let user: { id: string; organizationId: string };

  let appId: string;
  let version: AppVersion;
  let homePageId: string;

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  const createPage = (body: Record<string, unknown>) =>
    asAdmin(agent().post(`/api/v2/apps/${appId}/versions/${version.id}/pages`)).send({
      id: uuidv4(),
      index: 1,
      ...body,
    });

  const updatePage = (pageId: string, diff: Record<string, unknown>) =>
    asAdmin(agent().put(`/api/v2/apps/${appId}/versions/${version.id}/pages`)).send({ pageId, diff });

  const deletePage = (pageId: string, deleteAssociatedPages = false) =>
    asAdmin(agent().delete(`/api/v2/apps/${appId}/versions/${version.id}/pages`)).send({
      pageId,
      deleteAssociatedPages,
    });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const admin = await createAdmin(nestApp, 'page-invariants-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
    user = admin.user;
  });

  beforeEach(async () => {
    const application = await createApplication(nestApp, { name: `page-invariants-${uuidv4()}`, user });
    appId = application.id;
    version = await createApplicationVersion(nestApp, application as App & { organizationId: string }, { name: 'v1' });
    homePageId = version.homePageId;
    // The seed helper leaves status null; assertVersionEditable (GitSyncEditGuard) rejects any
    // non-DRAFT status before the request reaches the service, so make the version editable.
    await updateEntity(AppVersion, version.id, { status: AppVersionStatus.DRAFT });
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('handle format', () => {
    it('rejects creating a page whose handle is not valid kebab-case', async () => {
      const res = await createPage({ name: 'Reports', handle: 'Reports Page!' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/handle/i);
    });

    it('accepts creating a page with a valid kebab-case handle', async () => {
      const res = await createPage({ name: 'Reports', handle: 'reports-page' });
      expect(res.status).toBe(201);
    });

    it('rejects updating a page handle to an invalid value', async () => {
      const pageId = uuidv4();
      expect((await createPage({ id: pageId, name: 'Settings', handle: 'settings' })).status).toBe(201);

      const res = await updatePage(pageId, { handle: 'not a handle' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/handle/i);
    });
  });

  describe('handle uniqueness', () => {
    it('rejects creating a page whose handle duplicates an existing page', async () => {
      expect((await createPage({ name: 'First', handle: 'shared-handle' })).status).toBe(201);

      const res = await createPage({ name: 'Second', handle: 'shared-handle' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Page with same handle already exists');
    });

    it('rejects updating a page handle to one already used by another page', async () => {
      expect((await createPage({ name: 'Alpha', handle: 'alpha' })).status).toBe(201);
      const betaId = uuidv4();
      expect((await createPage({ id: betaId, name: 'Beta', handle: 'beta' })).status).toBe(201);

      const res = await updatePage(betaId, { handle: 'alpha' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Page with same handle already exists');
    });
  });

  describe('name uniqueness', () => {
    it('rejects creating a page whose name duplicates an existing page', async () => {
      expect((await createPage({ name: 'Dashboard', handle: 'dash-1' })).status).toBe(201);

      const res = await createPage({ name: 'Dashboard', handle: 'dash-2' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Page with same name already exists');
    });
  });

  describe('deletion', () => {
    it('rejects deleting the only page in the app', async () => {
      const res = await deletePage(homePageId);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('You cannot delete the only page in your app.');
    });

    it('rejects deleting the home page when other pages exist', async () => {
      expect((await createPage({ name: 'Second', handle: 'second' })).status).toBe(201);

      const res = await deletePage(homePageId);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Cannot delete home page');
    });

    it('allows deleting a non-home page when others remain', async () => {
      const pageId = uuidv4();
      expect((await createPage({ id: pageId, name: 'Scratch', handle: 'scratch' })).status).toBe(201);

      const res = await deletePage(pageId);
      expect(res.status).toBe(200);
    });

    it('rejects deleting a page group that still contains the home page', async () => {
      const groupId = uuidv4();
      await saveEntity(Page, {
        id: groupId,
        name: 'Group A',
        handle: 'group-a',
        index: 5,
        appVersionId: version.id,
        isPageGroup: true,
      } as Partial<Page>);
      // Move the home page under the group so deleting the group would remove the home page.
      await updateEntity(Page, homePageId, { pageGroupId: groupId });

      const res = await deletePage(groupId, true);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('page group as it contains the home page');
    });
  });

  describe('home page cannot be hidden or disabled', () => {
    it('rejects disabling the home page', async () => {
      const res = await updatePage(homePageId, { disabled: true });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('You cannot disable the home page');
    });

    it('rejects hiding the home page', async () => {
      const res = await updatePage(homePageId, { hidden: { value: true } });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('You cannot hide the home page');
    });

    it('allows disabling a non-home page — the rule is scoped to the home page', async () => {
      const pageId = uuidv4();
      expect((await createPage({ id: pageId, name: 'Extra', handle: 'extra' })).status).toBe(201);

      const res = await updatePage(pageId, { disabled: true });
      expect(res.status).toBe(200);
    });
  });
});
