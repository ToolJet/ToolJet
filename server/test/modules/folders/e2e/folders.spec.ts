import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createApplication,
  createApplicationVersion,
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
  saveEntity,
} from "test-helper";
import { AppVersion } from "src/entities/app_version.entity";
import { Folder } from "src/entities/folder.entity";
import { GroupPermissions } from "src/entities/group_permissions.entity";
import { WorkspaceBranch } from "@entities/workspace_branch.entity";
import { APP_TYPES } from "@modules/apps/constants";
import { GranularPermissions } from "@entities/granular_permissions.entity";
import { FoldersGroupPermissions } from "@entities/folders_group_permissions.entity";
import { GroupFolders } from "@entities/group_folders.entity";
import { ResourceType } from "@modules/group-permissions/constants";
import { AbilityService } from "@modules/ability/interfaces/IService";
import { MODULES } from "@modules/app/constants/modules";

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
        const appInFolderVersion = await createApplicationVersion(
          nestApp,
          appInFolder,
        );
        await updateEntity(AppVersion, appInFolderVersion.id, {
          appName: "App in folder",
        });

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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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
        const appInFolderVersion = await createApplicationVersion(
          nestApp,
          appInFolder,
        );
        await updateEntity(AppVersion, appInFolderVersion.id, {
          appName: "App in folder",
        });

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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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
          new Set([
            "id",
            "name",
            "organization_id",
            "created_at",
            "created_by",
            "updated_at",
            "folder_apps",
            "count",
            "type",
          ]),
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

        // App-level access surfaces the containing folder: the user can see "App in
        // folder" in Folder1, so Folder1 appears. Folder2's app is not accessible,
        // Folder3 and Folder4 are empty — none of those are surfaced.
        expect(new Set(folders.map((f) => f.name))).toEqual(new Set(['Folder1']));
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

      it("should return 400 when creating a folder with a duplicate name in the same org", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await createFolder(nestApp, {
          name: "DuplicateName",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .post("/api/folders")
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ name: "DuplicateName", type: FOLDER_TYPE });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe(
          "This folder name is already taken.",
        );
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

        // Seed the folder with developer as creator: the creator-owns check in
        // checkFolderManagePermission grants them rename access without needing
        // an explicit granular permission.
        const folder = await saveEntity(Folder, {
          name: "Folder1",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
          createdBy: developerUserData.user.id,
        } as any);

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
          folderDelete: true,
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

    describe("PUT /api/folders/:id | Git-sync gate", () => {
      it("should allow renaming an EMPTY folder in a git-sync workspace", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await saveEntity(WorkspaceBranch, {
          name: "main",
          organizationId: adminUserData.organization.id,
          isDefault: true,
        } as any);

        const folder = await createFolder(nestApp, {
          name: "EmptyFolder",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .put(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ name: "RenamedEmpty" });

        expect(response.statusCode).toBe(200);
      });

      it("should block renaming a NON-EMPTY folder in a git-sync workspace", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await saveEntity(WorkspaceBranch, {
          name: "main",
          organizationId: adminUserData.organization.id,
          isDefault: true,
        } as any);

        const folder = await createFolder(nestApp, {
          name: "PopulatedFolder",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App in folder",
          user: adminUserData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        const response = await request(nestApp.getHttpServer())
          .put(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ name: "ShouldBeBlocked" });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          "Folders with git-synced apps cannot be edited",
        );
      });
    });

    describe("DELETE /api/folders/:id | Git-sync gate", () => {
      it("should allow deleting an EMPTY folder in a git-sync workspace", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await saveEntity(WorkspaceBranch, {
          name: "main",
          organizationId: adminUserData.organization.id,
          isDefault: true,
        } as any);

        const folder = await createFolder(nestApp, {
          name: "EmptyToDelete",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
      });

      it("should block deleting a NON-EMPTY folder in a git-sync workspace", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await saveEntity(WorkspaceBranch, {
          name: "main",
          organizationId: adminUserData.organization.id,
          isDefault: true,
        } as any);

        const folder = await createFolder(nestApp, {
          name: "PopulatedToDelete",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App in folder",
          user: adminUserData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          "Folders with apps synced to git can't be deleted. Delete the git apps and try again.",
        );
      });
    });

    describe("PUT /api/folders/:id | Creator and builder permissions", () => {
      it("should allow a non-admin user to rename a folder they created", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const builderData = await createUser(nestApp, {
          email: "builder@tooljet.io",
          groups: ["builder"],
          organization: adminUserData.organization,
        });
        const builderLogin = await login(nestApp, builderData.user.email);

        // Seed directly: in EE, folder create requires an explicit permission;
        // bypass by seeding with createdBy = builder so the ownership check passes.
        const folder = await saveEntity(Folder, {
          name: "builder-owned",
          type: FOLDER_TYPE,
          organizationId: builderData.user.organizationId,
          createdBy: builderData.user.id,
        } as any);

        const renameResp = await request(nestApp.getHttpServer())
          .put(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", builderData.user.defaultOrganizationId)
          .set("Cookie", builderLogin.tokenCookie)
          .send({ name: "builder-renamed" });

        expect(renameResp.statusCode).toBe(200);
      });

      it("should allow a builder to rename a MODULE-type folder they did not create", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const builderData = await createUser(nestApp, {
          email: "builder@tooljet.io",
          groups: ["builder"],
          organization: adminUserData.organization,
        });
        const builderLogin = await login(nestApp, builderData.user.email);

        const moduleFolder = await createFolder(nestApp, {
          name: "admin-module-folder",
          type: APP_TYPES.MODULE,
          organizationId: adminUserData.organization.id,
        });

        const renameResp = await request(nestApp.getHttpServer())
          .put(`/api/folders/${moduleFolder.id}`)
          .set("tj-workspace-id", builderData.user.defaultOrganizationId)
          .set("Cookie", builderLogin.tokenCookie)
          .send({ name: "builder-renamed-module" });

        expect(renameResp.statusCode).toBe(200);
      });

      it("should block a builder from renaming a FRONT-END folder they did not create", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const builderData = await createUser(nestApp, {
          email: "builder@tooljet.io",
          groups: ["builder"],
          organization: adminUserData.organization,
        });
        const builderLogin = await login(nestApp, builderData.user.email);

        const feFolder = await createFolder(nestApp, {
          name: "admin-fe-folder",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const renameResp = await request(nestApp.getHttpServer())
          .put(`/api/folders/${feFolder.id}`)
          .set("tj-workspace-id", builderData.user.defaultOrganizationId)
          .set("Cookie", builderLogin.tokenCookie)
          .send({ name: "should-fail" });

        expect(renameResp.statusCode).toBe(403);
      });
    });

    describe("DELETE /api/folders/:id | Creator permissions", () => {
      it("should allow a non-admin user to delete a folder they created", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const builderData = await createUser(nestApp, {
          email: "builder@tooljet.io",
          groups: ["builder"],
          organization: adminUserData.organization,
        });
        const builderLogin = await login(nestApp, builderData.user.email);

        const folder = await saveEntity(Folder, {
          name: "to-delete-by-creator",
          type: FOLDER_TYPE,
          organizationId: builderData.user.organizationId,
          createdBy: builderData.user.id,
        } as any);

        const deleteResp = await request(nestApp.getHttpServer())
          .delete(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", builderData.user.defaultOrganizationId)
          .set("Cookie", builderLogin.tokenCookie);

        expect(deleteResp.statusCode).toBe(200);
      });
    });

    describe("PUT /api/folders/:id | Duplicate name", () => {
      it("should return 400 when renaming a folder to a name already taken in the same org", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        await createFolder(nestApp, {
          name: "TakenName",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });
        const folder = await createFolder(nestApp, {
          name: "OriginalName",
          type: FOLDER_TYPE,
          organizationId: adminUserData.organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .put(`/api/folders/${folder.id}`)
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ name: "TakenName" });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe(
          "This folder name is already taken.",
        );
      });
    });

    describe("PUT /api/folders/:id | Nonexistent folder", () => {
      it("should return 404 when updating a folder that does not exist", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        const response = await request(nestApp.getHttpServer())
          .put("/api/folders/00000000-0000-0000-0000-000000000000")
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ name: "ghost" });

        expect(response.statusCode).toBe(404);
      });
    });

    describe("DELETE /api/folders/:id | Nonexistent folder", () => {
      it("should return 404 when deleting a folder that does not exist", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedUser = await login(nestApp);

        const response = await request(nestApp.getHttpServer())
          .delete("/api/folders/00000000-0000-0000-0000-000000000000")
          .set("tj-workspace-id", adminUserData.user.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie);

        expect(response.statusCode).toBe(404);
      });
    });

    describe("GET /api/folder-apps | Non-git-sync workspace folder visibility", () => {
      async function grantFolderPermission(
        group: GroupPermissions,
        options: {
          folder?: Folder;
          canViewApps?: boolean;
          canEditApps?: boolean;
          canEditFolder?: boolean;
          isAll?: boolean;
        },
      ): Promise<void> {
        const isAll = options.isAll ?? !options.folder;
        const granPerm = await saveEntity(GranularPermissions, {
          groupId: group.id,
          name: "Folder permissions",
          type: ResourceType.FOLDER,
          isAll,
        });
        const folderPerm = await saveEntity(FoldersGroupPermissions, {
          granularPermissionId: granPerm.id,
          canViewApps: options.canViewApps ?? false,
          canEditApps: options.canEditApps ?? false,
          canEditFolder: options.canEditFolder ?? false,
        });
        if (options.folder && !isAll) {
          await saveEntity(GroupFolders, {
            folderId: options.folder.id,
            foldersGroupPermissionsId: folderPerm.id,
          });
        }
      }

      // TC1: admin sees all folders regardless of app count
      it("admin sees all folders including empty ones", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const loggedAdmin = await login(nestApp);

        const folderWithApp = await createFolder(nestApp, {
          name: "has-app",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        await createFolder(nestApp, {
          name: "empty",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });

        const app = await createApplication(nestApp, {
          name: "App1",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folderWithApp);

        const response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set("tj-workspace-id", adminData.user.defaultOrganizationId)
          .set("Cookie", loggedAdmin.tokenCookie);

        expect(response.statusCode).toBe(200);
        const names = response.body.folders.map((f) => f.name);
        expect(names).toContain("has-app");
        expect(names).toContain("empty");
      });

      // TC2: end-user with no folder perms sees nothing (EE requires explicit folder grant)
      it("end-user with no folder permissions sees no folders", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });
        const endUserLogin = await login(nestApp, endUserData.user.email);

        const folder = await createFolder(nestApp, {
          name: "folder-no-perm",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App2",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        const response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set("tj-workspace-id", endUserData.user.defaultOrganizationId)
          .set("Cookie", endUserLogin.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.folders).toEqual([]);
      });

      // TC3: end-user with app-level perm but no folder perm — folder IS surfaced (EE)
      it("end-user with only app-level permission but no folder permission sees the containing folder", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folder = await createFolder(nestApp, {
          name: "folder-app-only",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App3",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        // grant app-level view via custom group — no folder grant
        await createGroupPermission(nestApp, {
          group: "app-only-group",
          organization: adminData.organization,
        });
        const appOnlyGroup = await findEntityOrFail(GroupPermissions, {
          name: "app-only-group",
          organizationId: adminData.organization.id,
        });
        await grantAppPermission(nestApp, app, appOnlyGroup.id, { read: true });
        await createUserGroupPermissions(nestApp, endUserData.user, [
          "app-only-group",
        ]);

        const endUserLogin = await login(nestApp, endUserData.user.email);
        const response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set("tj-workspace-id", endUserData.user.defaultOrganizationId)
          .set("Cookie", endUserLogin.tokenCookie);

        expect(response.statusCode).toBe(200);
        // App-level access surfaces the containing folder — explicit folder permission is not required.
        expect(response.body.folders).toHaveLength(1);
        expect(response.body.folders[0].name).toBe("folder-app-only");
        expect(response.body.folders[0].count).toBe(1);
      });

      // TC4: end-user with canViewApps on a specific folder sees only that folder
      it("end-user with view permission on folder1 sees only folder1", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folder1 = await createFolder(nestApp, {
          name: "permitted-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const folder2 = await createFolder(nestApp, {
          name: "other-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });

        const app1 = await createApplication(nestApp, {
          name: "App4a",
          user: adminData.user,
        });
        const app2 = await createApplication(nestApp, {
          name: "App4b",
          user: adminData.user,
        }, false);
        await addAppToFolder(nestApp, app1, folder1);
        await addAppToFolder(nestApp, app2, folder2);

        await createGroupPermission(nestApp, {
          group: "folder-view-group",
          organization: adminData.organization,
        });
        const folderViewGroup = await findEntityOrFail(GroupPermissions, {
          name: "folder-view-group",
          organizationId: adminData.organization.id,
        });
        await grantFolderPermission(folderViewGroup, {
          folder: folder1,
          canViewApps: true,
          isAll: false,
        });
        await createUserGroupPermissions(nestApp, endUserData.user, [
          "folder-view-group",
        ]);

        const endUserLogin = await login(nestApp, endUserData.user.email);
        const response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set("tj-workspace-id", endUserData.user.defaultOrganizationId)
          .set("Cookie", endUserLogin.tokenCookie);

        expect(response.statusCode).toBe(200);
        const folderNames = response.body.folders.map((f) => f.name);
        expect(folderNames).toContain("permitted-folder");
        expect(folderNames).not.toContain("other-folder");
      });

      // TC5: isAll=true canViewApps shows all non-empty folders, hides empty ones
      it("end-user with isAll folder view perm sees all non-empty folders only", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folderWithApp = await createFolder(nestApp, {
          name: "non-empty-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        await createFolder(nestApp, {
          name: "empty-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });

        const app = await createApplication(nestApp, {
          name: "App5",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folderWithApp);

        await createGroupPermission(nestApp, {
          group: "all-folders-view",
          organization: adminData.organization,
        });
        const allFoldersGroup = await findEntityOrFail(GroupPermissions, {
          name: "all-folders-view",
          organizationId: adminData.organization.id,
        });
        await grantFolderPermission(allFoldersGroup, {
          canViewApps: true,
          isAll: true,
        });
        await createUserGroupPermissions(nestApp, endUserData.user, [
          "all-folders-view",
        ]);

        const endUserLogin = await login(nestApp, endUserData.user.email);
        const response = await request(nestApp.getHttpServer())
          .get(`/api/folder-apps?type=${FOLDER_TYPE}`)
          .set("tj-workspace-id", endUserData.user.defaultOrganizationId)
          .set("Cookie", endUserLogin.tokenCookie);

        expect(response.statusCode).toBe(200);
        const folderNames = response.body.folders.map((f) => f.name);
        expect(folderNames).toContain("non-empty-folder");
        expect(folderNames).not.toContain("empty-folder");
      });

      // TC6: canViewApps on folder → appSpecificEnvironmentAccess has released=true only (bug fix)
      it("folder canViewApps grants released-only env access in appSpecificEnvironmentAccess", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folder = await createFolder(nestApp, {
          name: "view-env-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App6",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        await createGroupPermission(nestApp, {
          group: "view-env-group",
          organization: adminData.organization,
        });
        const viewEnvGroup = await findEntityOrFail(GroupPermissions, {
          name: "view-env-group",
          organizationId: adminData.organization.id,
        });
        await grantFolderPermission(viewEnvGroup, {
          folder,
          canViewApps: true,
          isAll: false,
        });
        await createUserGroupPermissions(nestApp, endUserData.user, [
          "view-env-group",
        ]);

        const abilityService = nestApp.get(AbilityService);
        const perms = await abilityService.resourceActionsPermission(
          endUserData.user,
          {
            resources: [
              { resource: MODULES.APP },
              { resource: MODULES.FOLDER },
            ],
            organizationId: adminData.organization.id,
          },
        );

        const envAccess =
          perms[MODULES.APP]?.appSpecificEnvironmentAccess?.[app.id];
        expect(envAccess).toBeDefined();
        expect(envAccess?.released).toBe(true);
        expect(envAccess?.development).toBe(false);
        expect(envAccess?.staging).toBe(false);
        expect(envAccess?.production).toBe(false);
      });

      // TC7: canEditApps on folder → all envs true in appSpecificEnvironmentAccess
      it("folder canEditApps grants all-env access in appSpecificEnvironmentAccess", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folder = await createFolder(nestApp, {
          name: "edit-env-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App7",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        await createGroupPermission(nestApp, {
          group: "edit-env-group",
          organization: adminData.organization,
        });
        const editEnvGroup = await findEntityOrFail(GroupPermissions, {
          name: "edit-env-group",
          organizationId: adminData.organization.id,
        });
        await grantFolderPermission(editEnvGroup, {
          folder,
          canEditApps: true,
          isAll: false,
        });
        await createUserGroupPermissions(nestApp, endUserData.user, [
          "edit-env-group",
        ]);

        const abilityService = nestApp.get(AbilityService);
        const perms = await abilityService.resourceActionsPermission(
          endUserData.user,
          {
            resources: [
              { resource: MODULES.APP },
              { resource: MODULES.FOLDER },
            ],
            organizationId: adminData.organization.id,
          },
        );

        const envAccess =
          perms[MODULES.APP]?.appSpecificEnvironmentAccess?.[app.id];
        expect(envAccess).toBeDefined();
        expect(envAccess?.development).toBe(true);
        expect(envAccess?.staging).toBe(true);
        expect(envAccess?.production).toBe(true);
        expect(envAccess?.released).toBe(true);
      });

      // TC8: union semantics — app-level dev access + folder canViewApps → dev access preserved
      it("folder canViewApps does not strip existing app-level development access (union)", async () => {
        const adminData = await createUser(nestApp, {
          email: "admin@tooljet.io",
        });
        const endUserData = await createUser(nestApp, {
          email: "enduser@tooljet.io",
          groups: ["all_users"],
          organization: adminData.organization,
        });

        const folder = await createFolder(nestApp, {
          name: "union-folder",
          type: FOLDER_TYPE,
          organizationId: adminData.organization.id,
        });
        const app = await createApplication(nestApp, {
          name: "App8",
          user: adminData.user,
        });
        await addAppToFolder(nestApp, app, folder);

        // group1: grants edit (all-env) access to the specific app
        await createGroupPermission(nestApp, {
          group: "app-edit-group",
          organization: adminData.organization,
        });
        const appEditGroup = await findEntityOrFail(GroupPermissions, {
          name: "app-edit-group",
          organizationId: adminData.organization.id,
        });
        await grantAppPermission(nestApp, app, appEditGroup.id, {
          update: true,
        });

        // group2: grants folder canViewApps only (would set released=true, dev/staging/prod=false)
        await createGroupPermission(nestApp, {
          group: "folder-view-only",
          organization: adminData.organization,
        });
        const folderViewOnlyGroup = await findEntityOrFail(GroupPermissions, {
          name: "folder-view-only",
          organizationId: adminData.organization.id,
        });
        await grantFolderPermission(folderViewOnlyGroup, {
          folder,
          canViewApps: true,
          isAll: false,
        });

        await createUserGroupPermissions(nestApp, endUserData.user, [
          "app-edit-group",
          "folder-view-only",
        ]);

        const abilityService = nestApp.get(AbilityService);
        const perms = await abilityService.resourceActionsPermission(
          endUserData.user,
          {
            resources: [
              { resource: MODULES.APP },
              { resource: MODULES.FOLDER },
            ],
            organizationId: adminData.organization.id,
          },
        );

        const envAccess =
          perms[MODULES.APP]?.appSpecificEnvironmentAccess?.[app.id];
        expect(envAccess).toBeDefined();
        // app-edit-group grants dev/staging/prod — folder-view-only must not strip them
        expect(envAccess?.development).toBe(true);
        expect(envAccess?.staging).toBe(true);
        expect(envAccess?.production).toBe(true);
        expect(envAccess?.released).toBe(true);
      });
    });
  });
});
