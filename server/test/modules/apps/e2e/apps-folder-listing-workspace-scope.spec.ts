import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  addAppToFolder,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createFolder,
  createUser,
  initTestApp,
  login,
} from 'test-helper';

/** @group platform */
describe('AppsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('GET /api/apps?folder=:id | Folder from another workspace', () => {
    // One account: admin in workspace A, plain end user in workspace B. B holds a folder with an
    // app the account has no grant on.
    const seed = async () => {
      const bAdmin = await createUser(nestApp, { email: 'b-admin@tooljet.io', groups: ['admin'] });
      const hiddenApp = await createApplication(nestApp, { name: 'B hidden app', user: bAdmin.user }, false);
      await createApplicationVersion(nestApp, hiddenApp);
      const bFolder = await createFolder(nestApp, { name: 'B folder', organizationId: bAdmin.organization.id });
      await addAppToFolder(nestApp, hiddenApp, bFolder);

      const multiWorkspace = await createUser(nestApp, {
        email: 'multi@tooljet.io',
        groups: ['admin'],
        organizationName: 'Workspace A',
      });
      await createUser(
        nestApp,
        { email: 'multi@tooljet.io', groups: ['end-user'], organization: bAdmin.organization },
        multiWorkspace.user
      );

      return { bAdmin, bFolder, hiddenApp, workspaceAId: multiWorkspace.organization.id };
    };

    it('should not list apps of a folder that belongs to another workspace', async () => {
      const { bFolder, hiddenApp, workspaceAId } = await seed();
      const { tokenCookie } = await login(nestApp, 'multi@tooljet.io', 'password', workspaceAId);

      const response = await request(nestApp.getHttpServer())
        .get(`/api/apps?folder=${bFolder.id}&type=front-end`)
        .set('tj-workspace-id', workspaceAId)
        .set('Cookie', tokenCookie);

      expect(response.statusCode).toBe(404);
      expect(JSON.stringify(response.body)).not.toContain(hiddenApp.id);
    });

    it('should still list the folder apps in the workspace that owns the folder', async () => {
      const { bAdmin, bFolder, hiddenApp } = await seed();
      const { tokenCookie } = await login(nestApp, 'b-admin@tooljet.io', 'password', bAdmin.organization.id);

      const response = await request(nestApp.getHttpServer())
        .get(`/api/apps?folder=${bFolder.id}&type=front-end`)
        .set('tj-workspace-id', bAdmin.organization.id)
        .set('Cookie', tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.apps.map((a: { id: string }) => a.id)).toEqual([hiddenApp.id]);
    });
  });
});
