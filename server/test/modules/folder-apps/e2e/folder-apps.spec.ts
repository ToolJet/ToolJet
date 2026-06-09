import { INestApplication } from '@nestjs/common';
import { login, initTestApp, closeTestApp, createUser, createApplication, saveEntity } from 'test-helper';
import * as request from 'supertest';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';

async function setupOrganization(nestApp) {
  const adminUserData = await createUser(nestApp, {
    email: 'admin@tooljet.io',
    groups: ['end-user', 'admin'],
  });
  const adminUser = adminUserData.user;
  const organization = adminUserData.organization;

  const app = await createApplication(nestApp, {
    user: adminUser,
    name: 'sample app',
    isPublic: false,
  });

  return { adminUser, app };
}

/** @group platform */
describe('FolderAppsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('EE (plan: enterprise)', () => {
    describe('POST /api/folder-apps | Add app to folder', () => {
      it('should allow only authenticated users to add apps to folders', async () => {
        await request(nestApp.getHttpServer()).post('/api/folder-apps').expect(401);
      });

      it('should add an app to a folder', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);
        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);

        const loggedUser = await login(nestApp);

        const response = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          app_id: app.id,
          folder_id: folder.id,
        });
        expect(response.body.id).toBeDefined();
      });

      it('super admin should be able to add apps to folders in any organization', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);
        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);
        //super admin
        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          groups: ['end-user', 'admin'],
          userType: 'instance',
        });

        const loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUser.defaultOrganizationId
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({ folder_id: folder.id, app_id: app.id });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          app_id: app.id,
          folder_id: folder.id,
        });
        expect(response.body.id).toBeDefined();
      });

      it('should not add an app to a folder more than once', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);

        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);

        const loggedUser = await login(nestApp);

        await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        const response = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('App has already been added to the folder');
      });
    });

    describe('PUT /api/folder-apps/:id | Remove app from folder', () => {
      it('should remove an app from a folder', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);

        const loggedUser = await login(nestApp);

        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);
        // add app to folder
        const folderApp = await saveEntity(FolderApp, { folderId: folder.id, appId: app.id } as any);
        const response = await request(nestApp.getHttpServer())
          .put(`/api/folder-apps/${folderApp.folderId}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ app_id: folderApp.appId });

        expect(response.statusCode).toBe(200);
      });

      it('super admin should be able to remove an app from a folder', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);
        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);
        // add app to folder
        const folderApp = await saveEntity(FolderApp, { folderId: folder.id, appId: app.id } as any);

        //super admin
        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          groups: ['end-user', 'admin'],
          userType: 'instance',
        });

        const loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUser.defaultOrganizationId
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(nestApp.getHttpServer())
          .put(`/api/folder-apps/${folderApp.folderId}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({ app_id: folderApp.appId });

        expect(response.statusCode).toBe(200);
      });
    });
  });
});
