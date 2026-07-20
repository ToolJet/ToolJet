import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  getExternalApiAuthHeader,
  NONEXISTENT_UUID,
} from 'test-helper';
import { AppsUtilService } from '@ee/apps/util.service';
import { AppVersion } from 'src/entities/app_version.entity';

/**
 * External API — POST /ext/export/workspace/:workspaceId/apps/:appId
 *
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 400: malformed appId/workspaceId UUID, app not belonging to the workspace,
 *     unknown appVersion name
 *   - Happy path: response shape (app[0].definition, tooljet_version), exports the
 *     newest version by default, exports a specific version by ?appVersion=<name>
 *   - exportTJDB toggle: verifies findTooljetDbTables is actually skipped when
 *     ?exportTJDB=false (regression test for the boolean-coercion fix — the query
 *     param arrives as the string 'false', which is truthy unless parsed)
 */

/** @group platform */
describe('External API — POST /ext/export/workspace/:workspaceId/apps/:appId', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = getExternalApiAuthHeader(app);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  function exportUrl(workspaceId: string, appId: string, query = '') {
    return `/api/ext/export/workspace/${workspaceId}/apps/${appId}${query}`;
  }

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer()).post(exportUrl(NONEXISTENT_UUID, NONEXISTENT_UUID)).expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      await request(app.getHttpServer())
        .post(exportUrl(NONEXISTENT_UUID, NONEXISTENT_UUID))
        .set('Authorization', 'Basic wrong-token')
        .expect(403);
    });
  });

  describe('validation', () => {
    it('returns 400 for a non-UUID appId', async () => {
      await request(app.getHttpServer())
        .post(exportUrl(NONEXISTENT_UUID, 'not-a-uuid'))
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });

    it('returns 400 for a non-UUID workspaceId', async () => {
      await request(app.getHttpServer())
        .post(exportUrl('not-a-uuid', NONEXISTENT_UUID))
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });

    it('returns 400 when the app does not belong to the given workspace', async () => {
      const { user: owner } = await createUser(app, { email: `app-export-owner-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `app-export-other-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Foreign App', user: owner });
      await createApplicationVersion(app, seededApp);

      await request(app.getHttpServer())
        .post(exportUrl(otherOrg.id, seededApp.id))
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });

    it('returns 400 when ?appVersion references a version name that does not exist', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-badver-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'App', user });
      await createApplicationVersion(app, seededApp);

      await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id, '?appVersion=does-not-exist'))
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });
  });

  describe('happy path', () => {
    it('exports the app with definition + tooljet_version shape', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-shape-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Export Shape App', user });
      await createApplicationVersion(app, seededApp);

      const res = await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      expect(res.body).toHaveProperty('tooljet_version');
      expect(Array.isArray(res.body.app)).toBe(true);
      expect(res.body.app).toHaveLength(1);
      expect(res.body.app[0]).toHaveProperty('definition');
    });

    it('exports the newest version by default when no ?appVersion is given', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-newest-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Newest App', user });
      const olderVersion = await createApplicationVersion(app, seededApp, { name: 'older' });
      const newerVersion = await createApplicationVersion(app, seededApp, { name: 'newer' });
      // now() is transaction-scoped in Postgres, so both versions can land on the exact
      // same createdAt within this test's savepoint — force a real, unambiguous ordering.
      const versionRepo = getDefaultDataSource().getRepository(AppVersion);
      await versionRepo.update(olderVersion.id, { createdAt: new Date(Date.now() - 60_000) });
      await versionRepo.update(newerVersion.id, { createdAt: new Date() });

      const res = await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      // export() scopes appV2.appVersions to just the targeted version_id (app-import-export.service.ts).
      const exportedVersions = res.body.app[0].definition.appV2.appVersions;
      expect(exportedVersions).toHaveLength(1);
      expect(exportedVersions[0].id).toBe(newerVersion.id);
    });

    it('exports a specific version when ?appVersion=<name> is given', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-byname-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Named Version App', user });
      const targetVersion = await createApplicationVersion(app, seededApp, { name: 'target-v1' });
      await createApplicationVersion(app, seededApp, { name: 'other-v2' });

      const res = await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id, `?appVersion=${targetVersion.name}`))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      const exportedVersions = res.body.app[0].definition.appV2.appVersions;
      expect(exportedVersions).toHaveLength(1);
      expect(exportedVersions[0].id).toBe(targetVersion.id);
    });
  });

  describe('exportTJDB toggle', () => {
    it('checks for TJDB tables by default when the query param is omitted', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-tjdb-default-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'TJDB Default App', user });
      await createApplicationVersion(app, seededApp);

      const tjdbSpy = jest.spyOn(app.get(AppsUtilService), 'findTooljetDbTables');

      await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      expect(tjdbSpy).toHaveBeenCalledWith(seededApp.id);
    });

    it('checks for TJDB tables when ?exportTJDB=true is given explicitly', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-tjdb-true-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'TJDB True App', user });
      await createApplicationVersion(app, seededApp);

      const tjdbSpy = jest.spyOn(app.get(AppsUtilService), 'findTooljetDbTables');

      await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id, '?exportTJDB=true'))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      expect(tjdbSpy).toHaveBeenCalledWith(seededApp.id);
    });

    it('skips checking for TJDB tables when ?exportTJDB=false is given', async () => {
      const { user, organization } = await createUser(app, { email: `app-export-tjdb-false-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'TJDB False App', user });
      await createApplicationVersion(app, seededApp);

      const tjdbSpy = jest.spyOn(app.get(AppsUtilService), 'findTooljetDbTables');

      const res = await request(app.getHttpServer())
        .post(exportUrl(organization.id, seededApp.id, '?exportTJDB=false'))
        .set('Authorization', AUTH_HEADER)
        .expect(201);

      expect(tjdbSpy).not.toHaveBeenCalled();
      expect(res.body).not.toHaveProperty('tooljet_database');
    });
  });
});
