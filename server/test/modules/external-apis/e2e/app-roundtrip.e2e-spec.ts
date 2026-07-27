import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, createApplication, createApplicationVersion } from 'test-helper';

/**
 * External API — cross-cutting round trip: export (all versions) → import → list.
 *
 * The single-version happy paths for export/import individually are covered in
 * app-export.e2e-spec.ts / app-import.e2e-spec.ts. This file adds the one thing those
 * don't: a MULTI-VERSION app surviving a full export→import→list cycle with its version
 * count intact, exercising exportAllVersions=true end-to-end and doubling as a regression
 * test for the processAllWorkspaceAppsData raw-column fix (versions[] population on list).
 */

/** @group platform */
describe('External API — app export/import/list round trip', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('preserves all versions across export (exportAllVersions=true) → import → list', async () => {
    const { user, organization } = await createUser(app, { email: `app-roundtrip-${Date.now()}@tooljet.io` });
    const seededApp = await createApplication(app, { name: 'Multi-Version App', user });
    await createApplicationVersion(app, seededApp, { name: 'v1' });
    await createApplicationVersion(app, seededApp, { name: 'v2' });
    await createApplicationVersion(app, seededApp, { name: 'v3' });

    const exportRes = await request(app.getHttpServer())
      .post(`/api/ext/export/workspace/${organization.id}/apps/${seededApp.id}?exportAllVersions=true`)
      .set('Authorization', AUTH_HEADER)
      .expect(201);

    const exportedVersions = exportRes.body.app[0].definition.appV2.appVersions;
    expect(exportedVersions).toHaveLength(3);

    const { organization: targetOrg } = await createUser(app, { email: `app-roundtrip-target-${Date.now()}@tooljet.io` });

    await request(app.getHttpServer())
      .post(`/api/ext/import/workspace/${targetOrg.id}/apps`)
      .set('Authorization', AUTH_HEADER)
      .send({
        tooljet_version: exportRes.body.tooljet_version,
        appName: 'Imported Multi-Version App',
        app: exportRes.body.app,
        tooljet_database: exportRes.body.tooljet_database ?? [],
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${targetOrg.id}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    expect(listRes.body).toHaveLength(1);
    const importedApp = listRes.body[0];
    expect(importedApp.name).toBe('Imported Multi-Version App');
    expect(importedApp.versions).toHaveLength(3);
  });
});
