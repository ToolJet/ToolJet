import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  login,
  findEntityOrFail,
  updateEntity,
} from 'test-helper';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

/**
 * Every route that writes a version's `globalSettings` rejects a malformed declared-variables map
 * with a 400 naming the bad entry, so the editor never receives a map it cannot load. The general
 * version update (PUT /v2/apps/:id/versions/:versionId) accepts `globalSettings` as well as the
 * settings route, and both write through VersionUtilService.updateVersion.
 */
/** @group platform */
describe('Version global settings: declared variables map', () => {
  let nestApp: INestApplication;
  let appId: string;
  let versionId: string;
  let orgId: string;
  let cookie: string[];

  const valid = { id: 'v1', name: 'threshold', value: '5', fxActive: false };

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    const adminData = await createUser(nestApp, { email: 'vvv-admin@tooljet.io', groups: ['all_users', 'admin'] });
    orgId = adminData.organization.id;
    const app = await createApplication(nestApp, { name: 'Variables map validation', user: adminData.user });
    appId = app.id;
    versionId = (await createApplicationVersion(nestApp, app as never)).id;
    // Only a draft accepts edits; the seeded version starts saved.
    await updateEntity(AppVersion, versionId, { status: AppVersionStatus.DRAFT });
    cookie = (await login(nestApp, 'vvv-admin@tooljet.io')).tokenCookie;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const put = (path: string, body: object) =>
    request(nestApp.getHttpServer())
      .put(`/api/v2/apps/${appId}/versions/${versionId}${path}`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie)
      .send(body);

  const savedVariables = async () =>
    (await findEntityOrFail(AppVersion, { id: versionId } as never)).globalSettings?.['variables'];

  describe.each([
    ['PUT /v2/apps/:id/versions/:versionId', ''],
    ['PUT /v2/apps/:id/versions/:versionId/global_settings', '/global_settings'],
  ])('%s', (_route, path) => {
    it('should reject a null entry with a 400 naming it and leave the saved map unchanged', async () => {
      await put(path, { globalSettings: { variables: { v1: valid } } }).expect(200);

      const response = await put(path, { globalSettings: { variables: { v1: valid, bad: null } } });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ message: 'globalSettings.variables.bad must be an object' });
      expect(await savedVariables()).toEqual({ v1: valid });
    });

    it('should reject a map that is not an object', async () => {
      const response = await put(path, { globalSettings: { variables: 'x' } });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ message: expect.stringContaining('globalSettings.variables') });
    });

    it('should save a well-formed map', async () => {
      await put(path, { globalSettings: { variables: {} } }).expect(200);

      expect(await savedVariables()).toEqual({});
    });
  });
});
