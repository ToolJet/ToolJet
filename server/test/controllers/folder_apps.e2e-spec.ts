import { INestApplication } from '@nestjs/common';
import { authenticateUser, clearDB, createNestAppInstance, setupOrganization } from '../test.helper';
import * as request from 'supertest';
import { getManager } from 'typeorm';
import { Folder } from '../../src/entities/folder.entity';
import { FolderApp } from '../../src/entities/folder_app.entity';

describe('folder apps controller', () => {
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
  });

  describe('POST /api/folder_apps', () => {
    it('should allow only authenticated users to add apps to folders', async () => {
      await request(nestApp.getHttpServer()).post('/api/folder_apps').expect(401);
    });

    it('should add an app to a folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);
      const manager = getManager();
      // create a new folder
      const folder = await manager.save(
        manager.create(Folder, { name: 'folder', organizationId: adminUser.organizationId })
      );

      const loggedUser = await authenticateUser(nestApp);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/folder_apps`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ folder_id: folder.id, app_id: app.id });

      expect(response.statusCode).toBe(201);
      const { id, app_id, folder_id } = response.body;
      expect(id).toBeDefined();
      expect(app_id).toBe(app.id);
      expect(folder_id).toBe(folder.id);
    });

    it('should not add an app to a folder more than once', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);
      const manager = getManager();

      // create a new folder
      const folder = await manager.save(
        manager.create(Folder, { name: 'folder', organizationId: adminUser.organizationId })
      );

      const loggedUser = await authenticateUser(nestApp);

      await request(nestApp.getHttpServer())
        .post(`/api/folder_apps`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ folder_id: folder.id, app_id: app.id });

      const response = await request(nestApp.getHttpServer())
        .post(`/api/folder_apps`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ folder_id: folder.id, app_id: app.id });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('App has been already added to the folder');
    });

    it('should remove an app from a folder', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      const manager = getManager();
      // create a new folder
      const folder = await manager.save(
        manager.create(Folder, { name: 'folder', organizationId: adminUser.organizationId })
      );
      // add app to folder
      const folderApp = await manager.save(manager.create(FolderApp, { folderId: folder.id, appId: app.id }));
      const response = await request(nestApp.getHttpServer())
        .put(`/api/folder_apps/${folderApp.folderId}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ app_id: folderApp.appId });

      expect(response.statusCode).toBe(200);
    });
  });
  afterAll(async () => {
    await nestApp.close();
  });
});
