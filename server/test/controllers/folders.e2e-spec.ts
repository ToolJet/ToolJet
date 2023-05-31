import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createGroupPermission,
  createUserGroupPermissions,
  createAppGroupPermission,
  authenticateUser,
} from '../test.helper';
import { getManager } from 'typeorm';
import { Folder } from 'src/entities/folder.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';

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
      });
      const { user } = adminUserData;

      const loggedUser = await authenticateUser(nestApp);

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
      });
      await getManager().save(Folder, {
        name: 'Folder1',
        organizationId: anotherUserData.organization.id,
      });

      let response = await request(nestApp.getHttpServer())
        .get(`/api/folders`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

      let { folders } = response.body;
      expect(new Set(folders.map((folder) => folder.name))).toEqual(
        new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
      );

      let folder1 = folders[0];
      expect(new Set(Object.keys(folder1))).toEqual(
        new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count'])
      );
      expect(folder1.organization_id).toEqual(user.organizationId);
      expect(folder1.count).toEqual(1);

      response = await request(nestApp.getHttpServer())
        .get(`/api/folders?searchKey=app in`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

      ({ folders } = response.body);
      expect(new Set(folders.map((folder) => folder.name))).toEqual(
        new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
      );

      folder1 = folders[0];
      expect(new Set(Object.keys(folder1))).toEqual(
        new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count'])
      );
      expect(folder1.organization_id).toEqual(user.organizationId);
      expect(folder1.count).toEqual(1);

      response = await request(nestApp.getHttpServer())
        .get(`/api/folders?searchKey=some text`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

      ({ folders } = response.body);
      expect(new Set(folders.map((folder) => folder.name))).toEqual(
        new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
      );

      folder1 = folders[0];
      expect(new Set(Object.keys(folder1))).toEqual(
        new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count'])
      );
      expect(folder1.organization_id).toEqual(user.organizationId);
      expect(folder1.count).toEqual(0);
    });
  });

  it('should scope folders and app for user based on permission', async () => {
    const adminUserData = await createUser(nestApp, {
      email: 'admin@tooljet.io',
    });

    const newUserData = await createUser(nestApp, {
      email: 'developer@tooljet.io',
      groups: ['all_users'],
      organization: adminUserData.organization,
    });

    let loggedUser = await authenticateUser(nestApp);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;

    loggedUser = await authenticateUser(nestApp, newUserData.user.email);
    newUserData['tokenCookie'] = loggedUser.tokenCookie;

    const folder = await getManager().save(Folder, {
      name: 'Folder1',
      organizationId: adminUserData.organization.id,
    });
    const folder2 = await getManager().save(Folder, {
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

    const appInFolder2 = await createApplication(nestApp, {
      name: 'App in folder 2',
      user: adminUserData.user,
    });

    await getManager().save(FolderApp, {
      app: appInFolder2,
      folder: folder2,
    });

    await createApplication(nestApp, {
      name: 'Public App',
      user: adminUserData.user,
      isPublic: true,
    });

    const anotherUserData = await createUser(nestApp, {
      email: 'admin@organization.com',
    });
    await getManager().save(Folder, {
      name: 'another org folder',
      organizationId: anotherUserData.organization.id,
    });
    const findFolderAppsIn = (folders, folderName) => folders.find((f) => f.name === folderName)['folder_apps'];

    // admin can see all folders
    let response = await request(nestApp.getHttpServer())
      .get(`/api/folders`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', adminUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

    let { folders } = response.body;
    expect(new Set(folders.map((folder) => folder.name))).toEqual(
      new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
    );
    expect(findFolderAppsIn(folders, 'Folder1')).toHaveLength(1);
    expect(findFolderAppsIn(folders, 'Folder2')).toHaveLength(1);
    expect(findFolderAppsIn(folders, 'Folder3')).toHaveLength(0);
    expect(findFolderAppsIn(folders, 'Folder4')).toHaveLength(0);

    // new user cannot see any folders without having apps with access
    response = await request(nestApp.getHttpServer())
      .get(`/api/folders`)
      .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
      .set('Cookie', newUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

    folders = response.body.folders;
    expect(folders).toEqual([]);

    // new user can only see folders having apps with read permissions
    await createGroupPermission(nestApp, {
      group: 'folder-handler',
      folderCreate: false,
      organization: newUserData.organization,
    });
    const group = await getManager().findOneOrFail(GroupPermission, {
      where: { group: 'folder-handler' },
    });
    await createAppGroupPermission(nestApp, appInFolder, group.id, {
      read: true,
    });
    await createUserGroupPermissions(nestApp, newUserData.user, ['folder-handler']);

    response = await request(nestApp.getHttpServer())
      .get(`/api/folders`)
      .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
      .set('Cookie', newUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);

    folders = response.body.folders;

    expect(new Set(folders.map((folder) => folder.name))).toEqual(new Set(['Folder1']));

    expect(findFolderAppsIn(folders, 'Folder1')[0]['app_id']).toEqual(appInFolder.id);

    // new user can only see all folders with folder create permissions but apps are scoped with read permissions
    await getManager().update(GroupPermission, group.id, {
      folderCreate: true,
    });

    response = await request(nestApp.getHttpServer())
      .get(`/api/folders`)
      .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
      .set('Cookie', newUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    folders = response.body.folders;
    expect(new Set(folders.map((folder) => folder.name))).toEqual(
      new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
    );

    expect(findFolderAppsIn(folders, 'Folder1')).toHaveLength(1);
    expect(findFolderAppsIn(folders, 'Folder2')).toHaveLength(0);
    expect(findFolderAppsIn(folders, 'Folder3')).toHaveLength(0);
    expect(findFolderAppsIn(folders, 'Folder4')).toHaveLength(0);
  });

  describe('POST /api/folders', () => {
    it('should allow only authenticated users to create folder', async () => {
      await request(nestApp.getHttpServer()).post('/api/folders').expect(401);
    });

    it('should create new folder in an organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });
      const { user } = adminUserData;

      const loggedUser = await authenticateUser(nestApp);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/folders`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'my folder' });

      expect(response.statusCode).toBe(201);

      const { id, name, organization_id, created_at, updated_at } = response.body;
      expect(id).toBeDefined();
      expect(created_at).toBeDefined();
      expect(updated_at).toBeDefined();
      expect(name).toEqual('my folder');
      expect(organization_id).toEqual(user.organizationId);
    });
  });

  describe('PUT /api/folders/:id', () => {
    it('should be able to update an existing folder if group is admin or has update permission in the same organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(nestApp, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(nestApp, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization: adminUserData.organization,
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, viewerUserData.user.email);
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, developerUserData.user.email);
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerGroup = await getManager().findOneOrFail(GroupPermission, {
        where: { group: 'developer' },
      });

      await getManager().update(GroupPermission, developerGroup.id, {
        folderUpdate: true,
      });

      const folder = await getManager().save(Folder, {
        name: 'Folder1',
        organizationId: adminUserData.organization.id,
      });

      for (const [i, userData] of [adminUserData, developerUserData].entries()) {
        const name = `folder ${i}`;
        await request(nestApp.getHttpServer())
          .put(`/api/folders/${folder.id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({ name })
          .expect(200);

        const updatedFolder = await getManager().findOne(Folder, folder.id);

        expect(updatedFolder.name).toEqual(name);
      }

      await request(nestApp.getHttpServer())
        .put(`/api/folders/${folder.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({ name: 'my folder' })
        .expect(403);
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should be able to delete an existing folder if group is admin or has delete permission in the same organization', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(nestApp, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(nestApp, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization: adminUserData.organization,
      });

      const developerGroup = await getManager().findOneOrFail(GroupPermission, {
        where: { group: 'developer' },
      });

      await getManager().update(GroupPermission, developerGroup.id, {
        folderDelete: true,
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, viewerUserData.user.email);
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, developerUserData.user.email);
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      for (const userData of [adminUserData, developerUserData]) {
        const folder = await getManager().save(Folder, {
          name: 'Folder1',
          organizationId: adminUserData.organization.id,
        });

        const preCount = await getManager().count(Folder);

        await request(nestApp.getHttpServer())
          .delete(`/api/folders/${folder.id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send()
          .expect(200);

        const postCount = await getManager().count(Folder);
        expect(postCount).toEqual(preCount - 1);
      }

      const folder = await getManager().save(Folder, {
        name: 'Folder1',
        organizationId: adminUserData.organization.id,
      });

      await request(nestApp.getHttpServer())
        .delete(`/api/folders/${folder.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send()
        .expect(403);
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
