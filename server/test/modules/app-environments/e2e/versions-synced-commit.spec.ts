import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  buildTestSession,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createUser,
  getDefaultDataSource,
  initTestApp,
} from 'test-helper';

/** @group platform */
describe('AppEnvironmentsController', () => {
  describe('GET /api/app-environments/:id/versions | Git status of a version', () => {
    let app: INestApplication;
    let organizationId: string;
    let cookie: string[];
    let appId: string;
    let environmentId: string;
    let syncedVersionId: string;
    let neverSyncedVersionId: string;

    const commit = {
      sha: 'a3f9c21b4e7d8f0a1c2b3d4e5f60718293a4b5c6',
      message: 'Add sales dashboard filters',
      at: '2026-11-13T10:42:00.000Z',
    };

    const listVersions = () =>
      request(app.getHttpServer())
        .get(`/api/app-environments/${environmentId}/versions`)
        .query({ app_id: appId })
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie);

    beforeAll(async () => {
      ({ app } = await initTestApp());

      const { user, organization } = await createUser(app, { email: 'versions-synced-commit@tooljet.io' });
      const application = await createApplication(app, { name: 'Sales dashboard', user });
      const syncedVersion = await createApplicationVersion(app, application, { name: 'v1' });
      const neverSyncedVersion = await createApplicationVersion(app, application, { name: 'v2' });
      ({ tokenCookie: cookie } = await buildTestSession(user, organization.id));

      organizationId = organization.id;
      appId = application.id;
      environmentId = syncedVersion.currentEnvironmentId;
      syncedVersionId = syncedVersion.id;
      neverSyncedVersionId = neverSyncedVersion.id;

      await getDefaultDataSource().query(
        `UPDATE app_versions
            SET has_uncommitted_changes = true, synced_commit_sha = $2, synced_commit_message = $3, synced_at = $4
          WHERE id = $1`,
        [syncedVersionId, commit.sha, commit.message, commit.at]
      );
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should return the commit a version is synced to, so the header tag can name it', async () => {
      const response = await listVersions();

      expect(response.statusCode).toBe(200);
      expect(response.body.appVersions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: syncedVersionId,
            hasUncommittedChanges: true,
            syncedCommitSha: commit.sha,
            syncedCommitMessage: commit.message,
            syncedAt: expect.any(String),
          }),
        ])
      );
    });

    it('should return nulls for a version that was never pushed or pulled', async () => {
      const response = await listVersions();

      expect(response.statusCode).toBe(200);
      expect(response.body.appVersions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: neverSyncedVersionId,
            hasUncommittedChanges: false,
            syncedCommitSha: null,
            syncedCommitMessage: null,
            syncedAt: null,
          }),
        ])
      );
    });
  });
});
