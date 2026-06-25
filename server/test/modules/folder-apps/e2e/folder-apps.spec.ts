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
} from 'test-helper';
import * as request from 'supertest';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';

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

        expect(first.statusCode).toBe(201);

        const second = await request(nestApp.getHttpServer())
          .post(`/api/folder-apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ folder_id: folder.id, app_id: app.id });

        expect(second.statusCode).toBe(201);
        expect(second.body.id).toBe(first.body.id);
        expect(second.body).toMatchObject({ app_id: app.id, folder_id: folder.id });
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

        // Create versions on specific branches
        const versionA = await createApplicationVersion(nestApp, moduleA, { name: 'v1' });
        await updateEntity(AppVersion, versionA.id, {
          branchId: branchA.id,
          appName: 'Module A',
          slug: `module-a-${versionA.id}`,
        } as any);

        const versionB = await createApplicationVersion(nestApp, moduleB, { name: 'v1' });
        await updateEntity(AppVersion, versionB.id, {
          branchId: branchB.id,
          appName: 'Module B',
          slug: `module-b-${versionB.id}`,
        } as any);

        // Create a module folder and add modules to it (branch-scoped entries)
        const moduleFolder = await createFolder(nestApp, {
          name: 'Module Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        await saveEntity(FolderApp, { appId: moduleA.id, folderId: moduleFolder.id, branchId: branchA.id } as any);
        await saveEntity(FolderApp, { appId: moduleB.id, folderId: moduleFolder.id, branchId: branchB.id } as any);

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

        const versionA = await createApplicationVersion(nestApp, moduleA, { name: 'v1' });
        await updateEntity(AppVersion, versionA.id, {
          branchId: branchA.id,
          appName: 'Isolated Module',
          slug: `isolated-module-${versionA.id}`,
        } as any);

        const moduleFolder = await createFolder(nestApp, {
          name: 'Empty Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        // Add module but query with different branch
        const branchC = await saveEntity(WorkspaceBranch, {
          name: 'other-branch',
          organizationId: adminUser.organizationId,
          isDefault: false,
        } as any);

        await addAppToFolder(nestApp, moduleA, moduleFolder);

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
    });

      it('should align folder count with returned modules across pagination', async () => {
        const { adminUser } = await setupOrganization(nestApp);
        const loggedUser = await login(nestApp);

        const branchA = await saveEntity(WorkspaceBranch, {
          name: 'pagination-branch',
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
            false
          );
          const version = await createApplicationVersion(nestApp, mod, { name: 'v1' });
          await updateEntity(AppVersion, version.id, {
            branchId: branchA.id,
            appName: `Module ${i + 1}`,
            slug: `module-${i + 1}-${version.id}`,
          } as any);
          modules.push(mod);
        }

        const moduleFolder = await createFolder(nestApp, {
          name: 'Pagination Folder',
          type: APP_TYPES.MODULE,
          organizationId: adminUser.organizationId,
        });

        for (const mod of modules) {
          await saveEntity(FolderApp, { appId: mod.id, folderId: moduleFolder.id, branchId: branchA.id } as any);
        }

        // Fetch with page 1 (9 per page, so all 3 should fit)
        const response = await request(nestApp.getHttpServer())
          .get('/api/apps')
          .query({ folder: moduleFolder.id, type: 'module', page: 1 })
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('x-branch-id', branchA.id)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.apps).toHaveLength(3);
        expect(response.body.meta.folder_count).toBe(3);
        expect(response.body.meta.total_pages).toBe(1);
      });
    });
  });
});
