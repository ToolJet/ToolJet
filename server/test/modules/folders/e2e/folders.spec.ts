import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createApplication,
  createUser,
  initTestApp,
  closeTestApp,
  createGroupPermission,
  createUserGroupPermissions,
  grantAppPermission,
  login,
  createFolder,
  addAppToFolder,
  findEntityOrFail,
  findEntity,
  updateEntity,
  countEntities,
} from 'test-helper';
import { Folder } from 'src/entities/folder.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';

const FOLDER_TYPE = 'front-end';

/** @group platform */
describe('FoldersController', () => {
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
    describe('GET /api/folder-apps | List folder apps', () => {
      it('should allow only authenticated users to list folders', async () => {
        await request(nestApp.getHttpServer()).get(`/api/folder-apps?type=${FOLDER_TYPE}`).expect(401);
      });

      it('should list all folders in an organization', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
        });
        const { user } = adminUserData;

        const loggedUser = await login(nestApp);

        const folder = await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder2',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder3',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder4',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const appInFolder = await createApplication(nestApp, {
          name: 'App in folder',
          user: adminUserData.user,
        });
        await addAppToFolder(nestApp, appInFolder, folder);

        const anotherUserData = await createUser(nestApp, {
          email: 'admin@organization.com',
        });
        await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: anotherUserData.organization.id,
        });

        let response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
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
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 1,
        });

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}&searchKey=app in`)
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
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 1,
        });

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}&searchKey=some text`)
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
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 0,
        });
      });

      it('super admin should able to list all folders in an organization', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
        });
        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        const { user } = adminUserData;

        let loggedUser = await login(nestApp);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUserData.organization.id
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const folder = await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder2',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder3',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder4',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const appInFolder = await createApplication(nestApp, {
          name: 'App in folder',
          user: adminUserData.user,
        });
        await addAppToFolder(nestApp, appInFolder, folder);

        const anotherUserData = await createUser(nestApp, {
          email: 'admin@organization.com',
        });
        await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: anotherUserData.organization.id,
        });

        let response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

        let { folders } = response.body;
        expect(new Set(folders.map((folder) => folder.name))).toEqual(
          new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
        );

        let folder1 = folders[0];
        expect(new Set(Object.keys(folder1))).toEqual(
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 1,
        });

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}&searchKey=app in`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

        ({ folders } = response.body);
        expect(new Set(folders.map((folder) => folder.name))).toEqual(
          new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
        );

        folder1 = folders[0];
        expect(new Set(Object.keys(folder1))).toEqual(
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 1,
        });

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}&searchKey=some text`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

        ({ folders } = response.body);
        expect(new Set(folders.map((folder) => folder.name))).toEqual(
          new Set(['Folder1', 'Folder2', 'Folder3', 'Folder4'])
        );

        folder1 = folders[0];
        expect(new Set(Object.keys(folder1))).toEqual(
          new Set(['id', 'name', 'organization_id', 'created_at', 'updated_at', 'folder_apps', 'count', 'type'])
        );
        expect(folder1).toMatchObject({
          organization_id: user.organizationId,
          count: 0,
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

        let loggedUser = await login(nestApp);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(nestApp, newUserData.user.email);
        newUserData['tokenCookie'] = loggedUser.tokenCookie;

        const folder = await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        const folder2 = await createFolder(nestApp, {
          name: 'Folder2',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder3',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        await createFolder(nestApp, {
          name: 'Folder4',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const appInFolder = await createApplication(nestApp, {
          name: 'App in folder',
          user: adminUserData.user,
        });
        await addAppToFolder(nestApp, appInFolder, folder);

        const appInFolder2 = await createApplication(
          nestApp,
          {
            name: 'App in folder 2',
            user: adminUserData.user,
          },
          false
        );

        await addAppToFolder(nestApp, appInFolder2, folder2);

        await createApplication(
          nestApp,
          {
            name: 'Public App',
            user: adminUserData.user,
            isPublic: true,
          },
          false
        );

        const anotherUserData = await createUser(nestApp, {
          email: 'admin@organization.com',
        });
        await createFolder(nestApp, {
          name: 'another org folder',
          type: FOLDER_TYPE,
          organizationId: anotherUserData.organization.id,
        });
        const findFolderAppsIn = (folders, folderName) => folders.find((f) => f.name === folderName)['folder_apps'];

        // admin can see all folders
        let response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
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
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
          .set('Cookie', newUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(new Set(Object.keys(response.body))).toEqual(new Set(['folders']));

        folders = response.body.folders;
        expect(folders).toEqual([]);

        // new user can only see folders having apps with read permissions
        await createGroupPermission(nestApp, {
          group: 'folder-handler',
          folderCRUD: false,
          organization: newUserData.organization,
        });
        const group = await findEntityOrFail(GroupPermissions, {
          name: 'folder-handler',
        });
        await grantAppPermission(nestApp, appInFolder, group.id, {
          read: true,
        });
        await createUserGroupPermissions(nestApp, newUserData.user, ['folder-handler']);

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
          .set('Cookie', newUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        folders = response.body.folders;

        expect(new Set(folders.map((folder) => folder.name))).toEqual(new Set(['Folder1']));

        expect(findFolderAppsIn(folders, 'Folder1')[0]['app_id']).toEqual(appInFolder.id);

        // folderCRUD permission no longer grants visibility to all folders;
        // user still only sees folders containing apps they have read access to
        await updateEntity(GroupPermissions, group.id, {
          folderCRUD: true,
        });

        response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set('tj-workspace-id', newUserData.user.defaultOrganizationId)
          .set('Cookie', newUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        folders = response.body.folders;
        expect(new Set(folders.map((folder) => folder.name))).toEqual(new Set(['Folder1']));

        expect(findFolderAppsIn(folders, 'Folder1')).toHaveLength(1);
      });
    });

    describe('POST /api/folders | Create folder', () => {
      it('should allow only authenticated users to create folder', async () => {
        await request(nestApp.getHttpServer()).post('/api/folders').expect(401);
      });

      it('should create new folder in an organization', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
        });
        const { user } = adminUserData;

        const loggedUser = await login(nestApp);

        const response = await request(nestApp.getHttpServer())
          .post(`/api/folders`)
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'my folder', type: 'front-end' });

        expect(response.statusCode).toBe(201);

        expect(response.body).toMatchObject({
          name: 'my folder',
          organization_id: user.organizationId,
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.created_at).toBeDefined();
        expect(response.body.updated_at).toBeDefined();
      });

      it('super admin should be able to create new folder in an organization', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
        });

        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });

        let loggedUser = await login(nestApp);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUserData.organization.id
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(nestApp.getHttpServer())
          .post(`/api/folders`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({ name: 'my folder', type: 'front-end' });

        expect(response.statusCode).toBe(201);

        expect(response.body).toMatchObject({
          name: 'my folder',
          organization_id: adminUserData.user.organizationId,
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.created_at).toBeDefined();
        expect(response.body.updated_at).toBeDefined();
      });
    });

    describe('PUT /api/folders/:id | Update folder', () => {
      it('should be able to update an existing folder if group is admin or has update permission in the same organization or the user is a super admin', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          groups: ['all_users', 'admin'],
          userType: 'instance',
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

        let loggedUser = await login(nestApp);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(nestApp, viewerUserData.user.email);
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(nestApp, developerUserData.user.email);
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUserData.organization.id
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerGroup = await findEntityOrFail(GroupPermissions, {
          name: 'developer',
        });

        await updateEntity(GroupPermissions, developerGroup.id, {
          folderCRUD: true,
        });

        const folder = await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        for (const [i, userData] of [adminUserData, developerUserData, superAdminUserData].entries()) {
          const name = `folder ${i}`;
          await request(nestApp.getHttpServer())
            .put(`/api/folders/${folder.id}`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie'])
            .send({ name })
            .expect(200);

          const updatedFolder = await findEntity(Folder, { id: folder.id });

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

    describe('DELETE /api/folders/:id | Delete folder', () => {
      it('should be able to delete an existing folder if group is admin or has delete permission in the same organization or the user is a super admin', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(nestApp, {
          email: 'superadmin@tooljet.io',
          groups: ['all_users', 'admin'],
          userType: 'instance',
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

        const developerGroup = await findEntityOrFail(GroupPermissions, {
          name: 'developer',
        });

        await updateEntity(GroupPermissions, developerGroup.id, {
          folderCRUD: true,
        });

        let loggedUser = await login(nestApp);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(nestApp, viewerUserData.user.email);
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(nestApp, developerUserData.user.email);
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(
          nestApp,
          superAdminUserData.user.email,
          'password',
          adminUserData.organization.id
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        for (const userData of [adminUserData, developerUserData, superAdminUserData]) {
          const folder = await createFolder(nestApp, {
            name: 'Folder1',
            type: FOLDER_TYPE,
            organizationId: adminUserData.organization.id,
          });

          const preCount = await countEntities(Folder, {});

          await request(nestApp.getHttpServer())
            .delete(`/api/folders/${folder.id}`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie'])
            .send()
            .expect(200);

          const postCount = await countEntities(Folder, {});
          expect(postCount).toEqual(preCount - 1);
        }

        const folder = await createFolder(nestApp, {
          name: 'Folder1',
          type: FOLDER_TYPE,
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
  });
});
