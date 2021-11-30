import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createApplication, createUser, createNestAppInstance } from '../test.helper';
import { getManager } from 'typeorm';
import { Folder } from 'src/entities/folder.entity';
import { FolderApp } from 'src/entities/folder_app.entity';

describe('folders controller', () => {
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
  });

  describe('GET /api/folders', () => {
    it('should allow only authenticated users to list folders', async () => {
      await request(nestApp.getHttpServer()).get('/api/folders').expect(401);
    });

    it('should list all folders in an organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const { user } = adminUserData;

      const folder = await getManager().save(Folder, {
        name: 'Folder1',
        organizationId: adminUserData.organization.id,
      });
      await getManager().save(Folder, {
        name: 'Folder2',
        organizationId: adminUserData.organization.id,
      });
      await getManager().save(Folder, {
        name: 'Folder3',
        organizationId: adminUserData.organization.id,
      });
      await getManager().save(Folder, {
        name: 'Folder4',
        organizationId: adminUserData.organization.id,
      });

      const appInFolder = await createApplication(nestApp, {
        name: 'App in folder',
        user: adminUserData.user,
      });
      await getManager().save(FolderApp, {
        app: appInFolder,
        folder: folder,
      });

      const anotherUserData = await createUser(nestApp, {
        email: 'admin@organization.com',
        role: 'admin',
      });
      await getManager().save(Folder, {
        name: 'Folder1',
        organizationId: anotherUserData.organization.id,
      });

      const response = await request(nestApp.getHttpServer())
        .get(`/api/folders`)
        .set('Authorization', authHeaderForUser(user));

      expect(response.statusCode).toBe(200);
      expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

      const { folders } = response.body;
      expect(new Set(folders.map((folder) => folder.name))).toEqual(
        new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
      );

      const folder1 = folders[0];
      expect(new Set(Object.keys(folder1))).toEqual(
        new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count'])
      );
      expect(folder1.organization_id).toEqual(user.organizationId);
      expect(folder1.count).toEqual(1);
    });
  });

  describe('POST /api/folders', () => {
    it('should allow only authenticated users to create folder', async () => {
      await request(nestApp.getHttpServer()).post('/api/folders').expect(401);
    });

    it('should create new folder in an organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const { user } = adminUserData;

      const response = await request(nestApp.getHttpServer())
        .post(`/api/folders`)
        .set('Authorization', authHeaderForUser(user))
        .send({ name: 'My folder' });

      expect(response.statusCode).toBe(201);

      const { id, name, organization_id, created_at, updated_at } = response.body;
      expect(id).toBeDefined();
      expect(created_at).toBeDefined();
      expect(updated_at).toBeDefined();
      expect(name).toEqual('My folder');
      expect(organization_id).toEqual(user.organizationId);
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
