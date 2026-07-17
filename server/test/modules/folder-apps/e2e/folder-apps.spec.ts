import { INestApplication } from '@nestjs/common';
import {
  login,
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  createFolder,
  addAppToFolder,
  saveEntity,
  findEntity,
  updateEntity,
  createGroupPermission,
  createUserGroupPermissions,
} from "test-helper";
import * as request from "supertest";
import { Folder } from "@entities/folder.entity";
import { FolderApp } from "@entities/folder_app.entity";
import { WorkspaceBranch } from "@entities/workspace_branch.entity";
import { AppVersion } from "@entities/app_version.entity";
import { App } from "@entities/app.entity";
import { APP_TYPES } from "@modules/apps/constants";
import { OrganizationGitSync } from "@entities/organization_git_sync.entity";
import { GranularPermissions } from "@entities/granular_permissions.entity";
import { FoldersGroupPermissions } from "@entities/folders_group_permissions.entity";
import { GroupFolders } from "@entities/group_folders.entity";
import { ResourceType } from "@modules/group-permissions/constants";

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

  return { adminUser, organization, app };
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

      it('should be idempotent when adding an app to the same folder twice', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);

        // create a new folder
        const folder = await saveEntity(Folder, { name: 'folder', organizationId: adminUser.organizationId } as any);

        const loggedUser = await login(nestApp);

        const first = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        const firstResponse = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set("tj-workspace-id", adminUser.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });
        expect(firstResponse.statusCode).toBe(201);

        // create() is idempotent for same app+folder — returns the existing entry.
        const response = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        expect(response.statusCode).toBe(201);
        expect(response.body.id).toBe(firstResponse.body.id);
      });

      it("should add multiple apps to a folder via app_ids", async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const folder = await saveEntity(Folder, {
          name: "bulk-folder",
          organizationId: adminUser.organizationId,
        } as any);

        const app2 = await createApplication(nestApp, {
          user: adminUser,
          name: "bulk app 2",
          isPublic: false,
        }, false);
        const app3 = await createApplication(nestApp, {
          user: adminUser,
          name: "bulk app 3",
          isPublic: false,
        }, false);

        const response = await request(nestApp.getHttpServer())
          .post("/api/folder-apps")
          .set("tj-workspace-id", adminUser.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_ids: [app2.id, app3.id] });

        expect(response.statusCode).toBe(201);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
        // bulkCreate does not call decamelizeKeys so the response is camelCase
        expect(response.body.map((fa) => fa.appId).sort()).toEqual(
          [app2.id, app3.id].sort(),
        );
        expect(response.body.every((fa) => fa.folderId === folder.id)).toBe(true);
      });

      it("should move apps from another folder when bulk-adding to a new one", async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const sourceFolder = await saveEntity(Folder, {
          name: "bulk-source-folder",
          organizationId: adminUser.organizationId,
        } as any);
        const targetFolder = await saveEntity(Folder, {
          name: "bulk-target-folder",
          organizationId: adminUser.organizationId,
        } as any);

        const app1 = await createApplication(nestApp, {
          user: adminUser,
          name: "bulk-move-app-1",
          isPublic: false,
        }, false);
        const app2 = await createApplication(nestApp, {
          user: adminUser,
          name: "bulk-move-app-2",
          isPublic: false,
        }, false);

        // Seed apps in source folder directly (branchId=null, no git-sync context).
        await saveEntity(FolderApp, { folderId: sourceFolder.id, appId: app1.id } as any);
        await saveEntity(FolderApp, { folderId: sourceFolder.id, appId: app2.id } as any);

        const response = await request(nestApp.getHttpServer())
          .post("/api/folder-apps")
          .set("tj-workspace-id", adminUser.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie)
          .send({ folder_id: targetFolder.id, app_ids: [app1.id, app2.id] });

        expect(response.statusCode).toBe(201);
        expect(response.body.every((fa) => fa.folderId === targetFolder.id)).toBe(true);

        // Source folder entries must be gone.
        const remaining = await findEntity(FolderApp, { folderId: sourceFolder.id });
        expect(remaining).toBeNull();
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

    // =========================================================================
    // Module branch-scoped folder listing tests
    // =========================================================================
    // Verifies that module apps in folders are properly branch-scoped when
    // branchId is provided, ensuring cross-branch module leakage is prevented.
    // =========================================================================

    describe('GET /api/apps (type=module, folder context) | Module branch-scoped listing', () => {
      it('should return only modules on the specified branch when branchId is provided', async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        // Create workspace branches
        const branchA = await saveEntity(WorkspaceBranch, {
          name: 'feature-a',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        const branchB = await saveEntity(WorkspaceBranch, {
          name: 'feature-b',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        // Create module apps (skip env creation - already created by setupOrganization)
        const moduleA = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: 'Module A',
            type: APP_TYPES.MODULE,
          },
          false
        );

        const moduleB = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: 'Module B',
            type: APP_TYPES.MODULE,
          },
          false
        );

        // Create versions on specific branches.
        // chk_app_versions_branch_metadata: branch_id NOT NULL requires app_name + slug NOT NULL.
        const versionA = await createApplicationVersion(nestApp, moduleA, {
          name: "v1",
        });
        await updateEntity(AppVersion, versionA.id, {
          branchId: branchA.id,
          appName: moduleA.name,
          slug: moduleA.id,
        } as any);

        const versionB = await createApplicationVersion(nestApp, moduleB, {
          name: "v1",
        });
        await updateEntity(AppVersion, versionB.id, {
          branchId: branchB.id,
          appName: moduleB.name,
          slug: moduleB.id,
        } as any);

        // Create a module folder and add modules to it (branch-scoped entries)
        const moduleFolder = await createFolder(nestApp, {
          name: 'Module Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        // Seed FolderApp rows with explicit branchIds — the API sets branchId=null.
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: moduleA.id,
          branchId: branchA.id,
        } as any);
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: moduleB.id,
          branchId: branchB.id,
        } as any);

        // Fetch modules from folder with branchId=A
        const responseBranchA = await request(nestApp.getHttpServer())
          .get('/api/apps')
          .query({ folder: moduleFolder.id, type: 'module' })
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('x-branch-id', branchA.id)
          .set('Cookie', loggedUser.tokenCookie);

        expect(responseBranchA.statusCode).toBe(200);
        const appsBranchA = responseBranchA.body.apps;
        expect(appsBranchA).toHaveLength(1);
        expect(appsBranchA[0].id).toBe(moduleA.id);
        expect(appsBranchA[0].name).toBe('Module A');

        // Fetch modules from folder with branchId=B
        const responseBranchB = await request(nestApp.getHttpServer())
          .get('/api/apps')
          .query({ folder: moduleFolder.id, type: 'module' })
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('x-branch-id', branchB.id)
          .set('Cookie', loggedUser.tokenCookie);

        expect(responseBranchB.statusCode).toBe(200);
        const appsBranchB = responseBranchB.body.apps;
        expect(appsBranchB).toHaveLength(1);
        expect(appsBranchB[0].id).toBe(moduleB.id);
        expect(appsBranchB[0].name).toBe('Module B');
      });

      it('should return empty list when no modules on that branch are in the folder', async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const branchA = await saveEntity(WorkspaceBranch, {
          name: 'isolated-branch',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        const moduleA = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: 'Isolated Module',
            type: APP_TYPES.MODULE,
          },
          false
        );

        const versionA = await createApplicationVersion(nestApp, moduleA, {
          name: "v1",
        });
        await updateEntity(AppVersion, versionA.id, {
          branchId: branchA.id,
          appName: moduleA.name,
          slug: moduleA.id,
        } as any);

        const moduleFolder = await createFolder(nestApp, {
          name: 'Empty Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        // Seed the folder-app with the explicit branchId so the branch filter is meaningful.
        // addAppToFolder goes through the API and sets branchId=null; a null entry
        // would return 0 for *any* branch query, making the assertion vacuously true.
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: moduleA.id,
          branchId: branchA.id,
        } as any);

        // Query with a branch that has no modules in this folder.
        const branchC = await saveEntity(WorkspaceBranch, {
          name: 'other-branch',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        const response = await request(nestApp.getHttpServer())
          .get('/api/apps')
          .query({ folder: moduleFolder.id, type: 'module' })
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('x-branch-id', branchC.id)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.apps).toHaveLength(0);
        expect(response.body.meta.folder_count).toBe(0);
      });

    describe('Builder permissions on module folders', () => {
      it('should allow a builder to add a module app to a module folder', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-builder-add@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        await createUser(nestApp, { email: 'builder-add@tooljet.io', groups: ['builder'], organization });
        const { tokenCookie: builderCookie } = await login(nestApp, 'builder-add@tooljet.io', 'password');

        const moduleApp = await createApplication(nestApp, { user: adminUser, name: 'module app', type: APP_TYPES.MODULE }, false);

        const moduleFolder = await createFolder(nestApp, {
          name: 'module folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', builderCookie)
          .send({ folder_id: moduleFolder.id, app_id: moduleApp.id });

        expect(response.statusCode).toBe(201);
      });

      it('should allow a builder to remove a module app from a module folder', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-builder-remove@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        await createUser(nestApp, { email: 'builder-remove@tooljet.io', groups: ['builder'], organization });
        const { tokenCookie: builderCookie } = await login(nestApp, 'builder-remove@tooljet.io', 'password');

        const moduleApp = await createApplication(nestApp, { user: adminUser, name: 'module app for removal', type: APP_TYPES.MODULE }, false);

        const moduleFolder = await createFolder(nestApp, {
          name: 'module folder for removal',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        await addAppToFolder(nestApp, moduleApp, moduleFolder);

        const response = await request(nestApp.getHttpServer())
          .put(`/api/folder-apps/${moduleFolder.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', builderCookie)
          .send({ app_id: moduleApp.id });

        expect(response.statusCode).toBe(200);
      });

      it('should not allow a builder to add a front-end app to a front-end folder without explicit permission', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-builder-fe@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        await createUser(nestApp, { email: 'builder-frontend@tooljet.io', groups: ['builder'], organization });
        const { tokenCookie: builderCookie } = await login(nestApp, 'builder-frontend@tooljet.io', 'password');

        const frontEndApp = await createApplication(nestApp, { user: adminUser, name: 'front-end app' }, false);

        const frontEndFolder = await createFolder(nestApp, {
          name: 'front-end folder',
          type: APP_TYPES.FRONT_END,
          organizationId: adminUser.organizationId,
        });

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', builderCookie)
          .send({ folder_id: frontEndFolder.id, app_id: frontEndApp.id });

        expect(response.statusCode).toBe(403);
      });

      it('should block adding a module app to a front-end folder even for admin', async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const moduleApp = await createApplication(nestApp, { user: adminUser, name: 'module for mismatch', type: APP_TYPES.MODULE }, false);

        const frontEndFolder = await createFolder(nestApp, {
          name: 'fe folder for mismatch',
          type: APP_TYPES.FRONT_END,
          organizationId: adminUser.organizationId,
        });

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: frontEndFolder.id, app_id: moduleApp.id });

        expect(response.statusCode).toBe(403);
      });

      it('should block adding a front-end app to a module folder even for admin', async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const frontEndApp = await createApplication(nestApp, { user: adminUser, name: 'fe app for mismatch' }, false);

        const moduleFolder = await createFolder(nestApp, {
          name: 'module folder for mismatch',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: moduleFolder.id, app_id: frontEndApp.id });

        expect(response.statusCode).toBe(403);
      });

      it("should allow a builder to add their own app to their own folder via single-app path", async () => {
        const builderData = await createUser(nestApp, {
          email: "builder-owns-both-single@tooljet.io",
          groups: ["builder"],
        });
        const builderUser = builderData.user;
        const { tokenCookie: builderCookie } = await login(
          nestApp,
          "builder-owns-both-single@tooljet.io",
          "password",
        );

        const ownedApp = await createApplication(
          nestApp,
          { user: builderUser, name: "builder owned app single" },
          false,
        );
        const ownedFolder = await saveEntity(Folder, {
          name: "builder owned folder single",
          type: APP_TYPES.FRONT_END,
          organizationId: builderUser.organizationId,
          createdBy: builderUser.id,
        } as any);

        const response = await request(nestApp.getHttpServer())
          .post("/api/folder-apps")
          .set("tj-workspace-id", builderUser.defaultOrganizationId)
          .set("Cookie", builderCookie)
          .send({ folder_id: ownedFolder.id, app_id: ownedApp.id });

        expect(response.statusCode).toBe(201);
      });

      it("should allow a builder to bulk-add their own apps to their own folder", async () => {
        const builderData = await createUser(nestApp, {
          email: "builder-owns-both-bulk@tooljet.io",
          groups: ["builder"],
        });
        const builderUser = builderData.user;
        const { tokenCookie: builderCookie } = await login(
          nestApp,
          "builder-owns-both-bulk@tooljet.io",
          "password",
        );

        const ownedApp1 = await createApplication(
          nestApp,
          { user: builderUser, name: "builder bulk app 1" },
          false,
        );
        const ownedApp2 = await createApplication(
          nestApp,
          { user: builderUser, name: "builder bulk app 2" },
          false,
        );
        const ownedFolder = await saveEntity(Folder, {
          name: "builder owned folder bulk",
          type: APP_TYPES.FRONT_END,
          organizationId: builderUser.organizationId,
          createdBy: builderUser.id,
        } as any);

        const response = await request(nestApp.getHttpServer())
          .post("/api/folder-apps")
          .set("tj-workspace-id", builderUser.defaultOrganizationId)
          .set("Cookie", builderCookie)
          .send({ folder_id: ownedFolder.id, app_ids: [ownedApp1.id, ownedApp2.id] });

        expect(response.statusCode).toBe(201);
      });

      it("should not allow a builder to bulk-add apps to a folder they do not own", async () => {
        const adminUserData = await createUser(nestApp, {
          email: "admin-bulk-gate@tooljet.io",
          groups: ["end-user", "admin"],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        await createUser(nestApp, {
          email: "builder-no-folder-bulk@tooljet.io",
          groups: ["builder"],
          organization,
        });
        const { tokenCookie: builderCookie } = await login(
          nestApp,
          "builder-no-folder-bulk@tooljet.io",
          "password",
        );

        const app1 = await createApplication(
          nestApp,
          { user: adminUser, name: "admin app bulk 1" },
          false,
        );
        const adminFolder = await saveEntity(Folder, {
          name: "admin owned folder bulk",
          type: APP_TYPES.FRONT_END,
          organizationId: adminUser.organizationId,
          createdBy: adminUser.id,
        } as any);

        const response = await request(nestApp.getHttpServer())
          .post("/api/folder-apps")
          .set("tj-workspace-id", adminUser.defaultOrganizationId)
          .set("Cookie", builderCookie)
          .send({ folder_id: adminFolder.id, app_ids: [app1.id] });

        expect(response.statusCode).toBe(403);
      });
    });

    describe('Workflow folder canEditFolder permission (parallel to FOLDER, plus isolation)', () => {
      // CREATE_FOLDER_APP / DELETE_FOLDER_APP are gated on the canEditFolder tier
      // (editableFoldersId / isAllEditable), not canEditApps — canEditFolder implies
      // canEditApps in the permission hierarchy (ability/service.ts createUserContainerFolderPermissions).
      /** Grants canEditFolder on `folderId`, tagged with `resourceType`, to `groupId`. */
      async function grantFolderEditApps(
        groupId: string,
        folderId: string,
        resourceType: ResourceType
      ): Promise<void> {
        const granular = await saveEntity(GranularPermissions, {
          groupId,
          name: 'Folder edit grant',
          type: resourceType,
          isAll: false,
        } as any);
        const folderPerm = await saveEntity(FoldersGroupPermissions, {
          granularPermissionId: granular.id,
          canViewApps: true,
          canEditApps: false,
          canEditFolder: true,
        } as any);
        await saveEntity(GroupFolders, {
          folderId,
          foldersGroupPermissionsId: folderPerm.id,
        } as any);
      }

      it('should allow adding a workflow app to a workflow folder when the group has WORKFLOW_FOLDER canEditFolder scoped to it', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-wf-editapps@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        const endUserData = await createUser(nestApp, {
          email: 'enduser-wf-editapps@tooljet.io',
          groups: ['all_users'],
          organization,
        });
        const { tokenCookie: endUserCookie } = await login(nestApp, 'enduser-wf-editapps@tooljet.io', 'password');

        const group = await createGroupPermission(nestApp, { organization, group: 'wf-editapps-group' } as any);
        await createUserGroupPermissions(nestApp, endUserData.user, ['wf-editapps-group']);

        const workflowFolder = await createFolder(nestApp, {
          name: 'wf folder editapps',
          type: APP_TYPES.WORKFLOW,
          organizationId: adminUser.organizationId,
        });
        await grantFolderEditApps(group.id, workflowFolder.id, ResourceType.WORKFLOW_FOLDER);

        const workflowApp = await createApplication(
          nestApp,
          { user: adminUser, name: 'wf app editapps', type: APP_TYPES.WORKFLOW },
          false
        );

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', endUserCookie)
          .send({ folder_id: workflowFolder.id, app_id: workflowApp.id });

        expect(response.statusCode).toBe(201);
      });

      it('should not allow adding a workflow app to a workflow folder without the WORKFLOW_FOLDER-tagged grant', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-wf-noperm@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        const endUserData = await createUser(nestApp, {
          email: 'enduser-wf-noperm@tooljet.io',
          groups: ['all_users'],
          organization,
        });
        const { tokenCookie: endUserCookie } = await login(nestApp, 'enduser-wf-noperm@tooljet.io', 'password');

        const workflowFolder = await createFolder(nestApp, {
          name: 'wf folder noperm',
          type: APP_TYPES.WORKFLOW,
          organizationId: adminUser.organizationId,
        });

        const workflowApp = await createApplication(
          nestApp,
          { user: adminUser, name: 'wf app noperm', type: APP_TYPES.WORKFLOW },
          false
        );

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', endUserCookie)
          .send({ folder_id: workflowFolder.id, app_id: workflowApp.id });

        expect(response.statusCode).toBe(403);
      });

      it('should allow a builder to add/remove their own workflow app in their own workflow folder (ownership path, type-agnostic)', async () => {
        const builderData = await createUser(nestApp, {
          email: 'builder-owns-wf@tooljet.io',
          groups: ['builder'],
        });
        const builderUser = builderData.user;
        const { tokenCookie: builderCookie } = await login(nestApp, 'builder-owns-wf@tooljet.io', 'password');

        const ownedWorkflowApp = await createApplication(
          nestApp,
          { user: builderUser, name: 'builder owned workflow app', type: APP_TYPES.WORKFLOW },
          false
        );
        const ownedWorkflowFolder = await saveEntity(Folder, {
          name: 'builder owned workflow folder',
          type: APP_TYPES.WORKFLOW,
          organizationId: builderUser.organizationId,
          createdBy: builderUser.id,
        } as any);

        const addResponse = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', builderUser.defaultOrganizationId)
          .set('Cookie', builderCookie)
          .send({ folder_id: ownedWorkflowFolder.id, app_id: ownedWorkflowApp.id });

        expect(addResponse.statusCode).toBe(201);

        const removeResponse = await request(nestApp.getHttpServer())
          .put(`/api/folder-apps/${ownedWorkflowFolder.id}`)
          .set('tj-workspace-id', builderUser.defaultOrganizationId)
          .set('Cookie', builderCookie)
          .send({ app_id: ownedWorkflowApp.id });

        expect(removeResponse.statusCode).toBe(200);
      });

      // -----------------------------------------------------------------
      // Isolation: a FOLDER-tagged (App-folder) grant on a folder id must
      // not grant WORKFLOW_FOLDER access to that same folder id, and a
      // WORKFLOW_FOLDER-tagged grant must not grant FOLDER access. The
      // resource-type tag on the granular permission — not the folder's
      // own `type` column — is what must gate access.
      // -----------------------------------------------------------------
      it('isolation: a FOLDER-tagged canEditFolder grant does NOT let a user add apps to a workflow folder with the same id', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-isolation-1@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        const endUserData = await createUser(nestApp, {
          email: 'enduser-isolation-1@tooljet.io',
          groups: ['all_users'],
          organization,
        });
        const { tokenCookie: endUserCookie } = await login(nestApp, 'enduser-isolation-1@tooljet.io', 'password');

        const group = await createGroupPermission(nestApp, { organization, group: 'isolation-group-1' } as any);
        await createUserGroupPermissions(nestApp, endUserData.user, ['isolation-group-1']);

        const workflowFolder = await createFolder(nestApp, {
          name: 'wf folder isolation 1',
          type: APP_TYPES.WORKFLOW,
          organizationId: adminUser.organizationId,
        });
        // Foreign grant: FOLDER type tag, scoped to a workflow folder's id.
        await grantFolderEditApps(group.id, workflowFolder.id, ResourceType.FOLDER);

        const workflowApp = await createApplication(
          nestApp,
          { user: adminUser, name: 'wf app isolation 1', type: APP_TYPES.WORKFLOW },
          false
        );

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', endUserCookie)
          .send({ folder_id: workflowFolder.id, app_id: workflowApp.id });

        expect(response.statusCode).toBe(403);
      });

      it('isolation: a WORKFLOW_FOLDER-tagged canEditFolder grant does NOT let a user add apps to a front-end folder with the same id', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin-isolation-2@tooljet.io',
          groups: ['end-user', 'admin'],
        });
        const adminUser = adminUserData.user;
        const organization = adminUserData.organization;

        const endUserData = await createUser(nestApp, {
          email: 'enduser-isolation-2@tooljet.io',
          groups: ['all_users'],
          organization,
        });
        const { tokenCookie: endUserCookie } = await login(nestApp, 'enduser-isolation-2@tooljet.io', 'password');

        const group = await createGroupPermission(nestApp, { organization, group: 'isolation-group-2' } as any);
        await createUserGroupPermissions(nestApp, endUserData.user, ['isolation-group-2']);

        const frontEndFolder = await createFolder(nestApp, {
          name: 'fe folder isolation 2',
          type: APP_TYPES.FRONT_END,
          organizationId: adminUser.organizationId,
        });
        // Foreign grant: WORKFLOW_FOLDER type tag, scoped to a front-end folder's id.
        await grantFolderEditApps(group.id, frontEndFolder.id, ResourceType.WORKFLOW_FOLDER);

        const frontEndApp = await createApplication(
          nestApp,
          { user: adminUser, name: 'fe app isolation 2' },
          false
        );

        const response = await request(nestApp.getHttpServer())
          .post('/api/folder-apps')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', endUserCookie)
          .send({ folder_id: frontEndFolder.id, app_id: frontEndApp.id });

        expect(response.statusCode).toBe(403);
      });
    });

    it("should align folder count with returned modules across pagination", async () => {
      const { adminUser } = await setupOrganization(nestApp);
      const loggedUser = await login(nestApp);

      const branchA = await saveEntity(WorkspaceBranch, {
        name: "pagination-branch",
        organizationId: adminUser.organizationId,
        isDefault: false,
      } as any);

      // Create 3 modules, all on branchA
      const modules = [];
      for (let i = 0; i < 3; i++) {
        const mod = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: `Module ${i + 1}`,
            type: APP_TYPES.MODULE,
          },
          false,
        );
        const version = await createApplicationVersion(nestApp, mod, {
          name: "v1",
        });
        await updateEntity(AppVersion, version.id, {
          branchId: branchA.id,
          appName: mod.name,
          slug: mod.id,
        } as any);
        modules.push(mod);
      }

      const moduleFolder = await createFolder(nestApp, {
        name: "Pagination Folder",
        type: APP_TYPES.MODULE,
        organizationId: adminUser.organizationId,
      });

      for (const mod of modules) {
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: mod.id,
          branchId: branchA.id,
        } as any);
      }

      // Fetch with page 1 (9 per page, so all 3 should fit)
      const response = await request(nestApp.getHttpServer())
        .get("/api/apps")
        .query({ folder: moduleFolder.id, type: "module", page: 1 })
        .set("tj-workspace-id", adminUser.defaultOrganizationId)
        .set("x-branch-id", branchA.id)
        .set("Cookie", loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.apps).toHaveLength(3);
      expect(response.body.meta.folder_count).toBe(3);
      expect(response.body.meta.total_pages).toBe(1);
    });

    describe("GET /api/folder-apps | Default-branch fallback in git-sync orgs", () => {
      it("should show only default-branch apps when no x-branch-id header and git-sync is configured", async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const defaultBranch = await saveEntity(WorkspaceBranch, {
          name: 'main',
          organizationId: adminUser.organizationId,
          isDefault: true,
        } as any);
        const featureBranch = await saveEntity(WorkspaceBranch, {
          name: 'feature',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        await saveEntity(OrganizationGitSync, {
          organizationId: adminUser.organizationId,
        } as any);

        const moduleOnDefault = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: "DefaultBranchModule",
            type: APP_TYPES.MODULE,
          },
          false,
        );
        const versionDefault = await createApplicationVersion(
          nestApp,
          moduleOnDefault,
          { name: "v1" },
        );
        await updateEntity(AppVersion, versionDefault.id, {
          branchId: defaultBranch.id,
          appName: moduleOnDefault.name,
          slug: moduleOnDefault.id,
        } as any);

        const moduleOnFeature = await createApplication(
          nestApp,
          {
            user: adminUser,
            name: "FeatureBranchModule",
            type: APP_TYPES.MODULE,
          },
          false,
        );
        const versionFeature = await createApplicationVersion(
          nestApp,
          moduleOnFeature,
          { name: "v1" },
        );
        await updateEntity(AppVersion, versionFeature.id, {
          branchId: featureBranch.id,
          appName: moduleOnFeature.name,
          slug: moduleOnFeature.id,
        } as any);

        const moduleFolder = await createFolder(nestApp, {
          name: 'Default-branch Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });
        // Seed FolderApp rows with explicit branchIds so the branch filter hits.
        // addAppToFolder goes through the API and sets branchId=null; direct seed is required here.
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: moduleOnDefault.id,
          branchId: defaultBranch.id,
        } as any);
        await saveEntity(FolderApp, {
          folderId: moduleFolder.id,
          appId: moduleOnFeature.id,
          branchId: featureBranch.id,
        } as any);

        // No x-branch-id → backend resolves the default branch and filters by it.
        const response = await request(nestApp.getHttpServer())
          .get("/api/folder-apps")
          .query({ type: APP_TYPES.MODULE })
          .set("tj-workspace-id", adminUser.defaultOrganizationId)
          .set("Cookie", loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        const folderNames = response.body.folders.map((f: any) => f.name);
        expect(folderNames).toContain("Default-branch Folder");

        const returnedFolder = response.body.folders.find(
          (f: any) => f.name === "Default-branch Folder",
        );
        // Only the default-branch module should be visible; the feature-branch one is filtered out.
        expect(returnedFolder.count).toBe(1);
      });
    });
  });
  });
});
