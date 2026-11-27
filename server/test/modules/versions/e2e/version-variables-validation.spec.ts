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

  // Saved maps are keyed by variable name.
  const valid = { value: '5', fxActive: false };

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
      await put(path, { globalSettings: { variables: { threshold: valid } } }).expect(200);

      const response = await put(path, { globalSettings: { variables: { threshold: valid, bad: null } } });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ message: 'globalSettings.variables.bad must be an object' });
      expect(await savedVariables()).toEqual({ threshold: valid });
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
  // Names are case-sensitive identifiers. Responses that run through humps must not rename them
  // (`selectedOrderID` would become `selected_order_i_d`, `fxActive` inside the map `fx_active`).
  describe('reading the saved map back', () => {
    const named = {
      selectedOrderID: { value: '42', fxActive: false },
      user_name: { value: 'a', fxActive: true },
      $total: { value: '{{1}}', fxActive: false },
    };
    const get = (path: string) =>
      request(nestApp.getHttpServer()).get(path).set('tj-workspace-id', orgId).set('Cookie', cookie);

    beforeAll(async () => {
      await put('/global_settings', { globalSettings: { variables: named } }).expect(200);
    });

    it('should keep variable names and fields as stored on editor load (GET /api/apps/:id)', async () => {
      const response = await get(`/api/apps/${appId}`).expect(200);

      expect(response.body.editing_version.global_settings.variables).toEqual(named);
    });

    it('should keep variable names and fields as stored on version switch (GET /api/v2/apps/:id/versions/:versionId)', async () => {
      const response = await get(`/api/v2/apps/${appId}/versions/${versionId}?mode=edit`).expect(200);

      expect(response.body.editing_version.globalSettings.variables).toEqual(named);
    });

    it('should reject an old id-keyed map on save', async () => {
      const response = await put('/global_settings', {
        globalSettings: { variables: { 'a1b2-c3': { id: 'a1b2-c3', name: 'x', value: '1', fxActive: false } } },
      });

      expect(response.status).toBe(400);
      expect(await savedVariables()).toEqual(named);
    });
  });
});
