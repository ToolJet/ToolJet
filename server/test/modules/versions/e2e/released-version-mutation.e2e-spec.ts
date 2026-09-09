import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createApplication,
  createApplicationVersion,
  markVersionAsReleased,
  createDataSource,
  createDataQuery,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

/**
 * Released-version freeze at the API boundary (MutableAppVersionGuard + the version-settings
 * field-scoped check). The frontend freezes the editor on the released version, but non-UI clients
 * (MCP/PAT tokens, the public API) call the same controllers directly, so the invariant has to hold
 * server-side.
 *
 * These are route-level tests on purpose: the guard's whole value is being wired onto the right
 * routes, so a hand-mocked ExecutionContext would pass even if every @UseGuards binding were
 * reverted. Each case drives the real HTTP → guard → service pipeline against a genuinely released
 * version (App.currentVersionId points at it while its status is still DRAFT — releasing only
 * repoints the pointer, so this reproduces the exact production state the frontend-only check
 * missed).
 *
 * @group platform
 */
describe('Released app version is immutable via the API', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];
  let endUserCookie: string[];

  let appId: string;
  let releasedVersion: AppVersion;
  let draftVersion: AppVersion;

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);
  const asEndUser = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', endUserCookie);

  // A minimal-but-complete Button component diff, matching the shape the editor posts.
  const buildComponentDiff = () => ({
    [uuidv4()]: {
      name: `button${Date.now()}`,
      type: 'Button',
      layouts: {
        desktop: { top: 80, left: 15, width: 4, height: 40 },
        mobile: { top: 80, left: 15, width: 4, height: 40 },
      },
      general: {},
      generalStyles: {},
      others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
      properties: { text: { value: 'Button' }, visibility: { value: '{{true}}' } },
      styles: {},
      validation: {},
      parent: null,
    },
  });

  const postComponent = (versionId: string, pageId: string, extraBody: Record<string, unknown> = {}) =>
    agent()
      .post(`/api/v2/apps/${appId}/versions/${versionId}/components`)
      .send({ is_user_switched_version: false, pageId, diff: buildComponentDiff(), ...extraBody });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

    const admin = await createAdmin(nestApp, 'released-guard-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;

    const endUser = await createEndUser(nestApp, 'released-guard-enduser@tooljet.io', { workspace: admin.workspace });
    endUserCookie = endUser.cookie;

    const application = await createApplication(nestApp, { name: 'released-guard-app', user: admin.user });
    appId = application.id;

    releasedVersion = await createApplicationVersion(nestApp, application as App & { organizationId: string }, {
      name: 'released',
    });
    draftVersion = await createApplicationVersion(nestApp, application as App & { organizationId: string }, {
      name: 'draft',
    });

    // The seed helper leaves status null; real versions are DRAFT. Set both so they're editable
    // (assertVersionEditable rejects any non-DRAFT status) — the released one stays DRAFT on purpose:
    // releasing only repoints currentVersionId, so this is the exact production state under test.
    await updateEntity(AppVersion, releasedVersion.id, { status: AppVersionStatus.DRAFT });
    await updateEntity(AppVersion, draftVersion.id, { status: AppVersionStatus.DRAFT });

    // Release the first version — this only repoints App.currentVersionId; the version row keeps
    // its DRAFT status, which is exactly why the status-based check alone doesn't catch it.
    await markVersionAsReleased(appId, releasedVersion.id);
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('components', () => {
    it('rejects creating a component on the released version', async () => {
      const res = await asAdmin(postComponent(releasedVersion.id, releasedVersion.homePageId));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You cannot update a released version');
    });

    it('allows creating a component on a draft (non-released) version', async () => {
      const res = await asAdmin(postComponent(draftVersion.id, draftVersion.homePageId));
      expect(res.status).toBe(201);
    });

    it('cannot be bypassed with is_user_switched_version on the released version', async () => {
      const res = await asAdmin(
        postComponent(releasedVersion.id, releasedVersion.homePageId, { is_user_switched_version: true })
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You cannot update a released version');
    });

    it('returns 403 (not 400) for a caller without edit permission — authorize before the freeze check', async () => {
      const res = await asEndUser(postComponent(releasedVersion.id, releasedVersion.homePageId));
      expect(res.status).toBe(403);
    });
  });

  describe('pages', () => {
    it('rejects creating a page on the released version', async () => {
      const res = await asAdmin(
        agent()
          .post(`/api/v2/apps/${appId}/versions/${releasedVersion.id}/pages`)
          .send({ name: 'Page 2', handle: 'page-2' })
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You cannot update a released version');
    });
  });

  describe('queries', () => {
    it('rejects deleting a query on the released version (target resolved from :versionId)', async () => {
      const dataSource = await createDataSource(nestApp, {
        appVersion: releasedVersion,
        kind: 'restapi',
        name: `ds-${Date.now()}`,
      });
      const query = await createDataQuery(nestApp, {
        dataSource,
        appVersion: releasedVersion,
        name: `q${Date.now()}`,
      });

      const res = await asAdmin(agent().delete(`/api/data-queries/${query.id}/versions/${releasedVersion.id}`));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You cannot update a released version');
    });
  });
});
