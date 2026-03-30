import { INestApplication } from '@nestjs/common';
import { loginAs, resetDB, initTestApp, createUser, createApplication, saveEntity } from '../test.helper';
import * as request from 'supertest';
import { Folder } from '../../src/entities/folder.entity';
import { FolderApp } from '../../src/entities/folder_app.entity';

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

describe('folder apps controller', () => {
  let nestApp: INestApplication;

  beforeEach(async () => {
    await resetDB();
  });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  describe('POST /api/folder-apps', () => {
    it('should allow only authenticated users to add apps to folders', async () => {
      await request(nestApp.getHttpServer()).post('/api/folder-apps').expect(401);
    });

    it('should add an app to a folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);
      // create a new folder
      const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);

      const loggedUser = await loginAs(nestApp);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/folder-apps`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ folder_id: folder.id, app_id: app.id });

      expect(response.statusCode).toBe(201);
      const { id, app_id, folder_id } = response.body;
      expect(id).toBeDefined();
      expect(app_id).toBe(app.id);
      expect(folder_id).toBe(folder.id);
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

      const loggedUser = await loginAs(
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
      const { id, app_id, folder_id } = response.body;
      expect(id).toBeDefined();
      expect(app_id).toBe(app.id);
      expect(folder_id).toBe(folder.id);
    });

    it('should not add an app to a folder more than once', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      // create a new folder
      const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);

      const loggedUser = await loginAs(nestApp);

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

    it('should remove an app from a folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      const loggedUser = await loginAs(nestApp);

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

      const loggedUser = await loginAs(
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
  afterAll(async () => {
    await nestApp.close();
  });
});
