import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  createAppGroupPermission,
  createAppEnvironments,
  createDataSourceOption,
  generateAppDefaults,
  authenticateUser,
  logoutUser,
  getAllEnvironments,
  getAppEnvironment,
} from '../test.helper';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { getManager, getRepository } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { Folder } from 'src/entities/folder.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { AuditLog } from 'src/entities/audit_log.entity';
import { Credential } from 'src/entities/credential.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';

describe('apps controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('GET /api/apps/:id', () => {
    it('should allow only authenticated users to update app params', async () => {
      await request(app.getHttpServer()).put('/api/apps/uuid').expect(401);
    });
  });

  describe('POST /api/apps', () => {
    describe('authorization', () => {
      it('should be able to create app if user has admin group', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const organization = adminUserData.organization;
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users', 'developer'],
          organization,
        });

        loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['all_users', 'viewer'],
          organization,
        });

        loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        await createApplicationVersion(app, application);

        for (const userData of [viewerUserData, developerUserData]) {
          const response = await request(app.getHttpServer())
            .post(`/api/apps`)
            .set('tj-workspace-id', userData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie']);

          expect(response.statusCode).toBe(403);
        }

        const response = await request(app.getHttpServer())
          .post(`/api/apps`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie']);

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toContain('My app');

        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
        await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
      });
    });

    it('should create app with default values', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app);

      await createAppEnvironments(app, adminUserData.organization.id);

      const response = await request(app.getHttpServer())
        .post(`/api/apps`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toContain('My app');

      const appId = response.body.id;
      const application = await App.findOneOrFail({ where: { id: appId } });

      expect(application.name).toContain('My app');
      expect(application.id).toBe(application.slug);

      // await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
    });

    it('should be able to create app if user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      await createAppEnvironments(app, adminUserData.organization.id);

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );
      const response = await request(app.getHttpServer())
        .post(`/api/apps`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toContain('My app');

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(response.body.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(response.body.name);
      expect(auditLog.actionType).toEqual('APP_CREATE');
      expect(auditLog.createdAt).toBeDefined();
    });
  });

  describe('GET /api/apps', () => {
    describe('authorization', () => {
      it('should allow only authenticated users to fetch apps', async () => {
        await request(app.getHttpServer()).get('/api/apps').expect(401);
      });
    });

    describe('without folder', () => {
      it('should return all permissible apps with metadata', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['all_users', 'developer'],
          userType: 'instance',
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const organization = adminUserData.organization;
        const allUserGroup = await getManager().findOneOrFail(GroupPermission, {
          where: {
            group: 'all_users',
            organization: adminUserData.organization,
          },
        });
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users', 'developer'],
          organization,
        });

        loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        loggedUser = await authenticateUser(app, 'another@tooljet.io');
        anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const anotherApplication = await createApplication(app, {
          name: 'Another organization App',
          user: anotherOrgAdminUserData.user,
        });

        const nonPermissibleApp = await createApplication(
          app,
          {
            name: 'Non Permissible App',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: nonPermissibleApp.id }, { read: false });

        const publicApp = await createApplication(
          app,
          {
            name: 'Public App',
            user: adminUserData.user,
            isPublic: true,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: publicApp.id }, { read: false });
        const ownedApp = await createApplication(
          app,
          {
            name: 'Owned App',
            user: developerUserData.user,
          },
          false
        );
        const appNotInFolder = await createApplication(
          app,
          {
            name: 'App not in folder',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(
          AppGroupPermission,
          { app: appNotInFolder, groupPermissionId: allUserGroup },
          { read: true }
        );
        const appInFolder = await createApplication(
          app,
          {
            name: 'App in folder',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(
          AppGroupPermission,
          { app: appInFolder, groupPermissionId: allUserGroup },
          { read: true }
        );
        const folder = await getManager().save(Folder, {
          name: 'Folder',
          organizationId: adminUserData.organization.id,
        });
        await getManager().save(FolderApp, {
          app: appInFolder,
          folder: folder,
        });

        let response = await request(app.getHttpServer())
          .get(`/api/apps`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        let { meta, apps } = response.body;
        let appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(
          new Set([publicApp.name, ownedApp.name, appNotInFolder.name, appInFolder.name])
        );
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 4,
          folder_count: 0,
          current_page: 1,
        });

        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=public`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        ({ meta, apps } = response.body);
        appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(new Set([publicApp.name]));
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 1,
          folder_count: 0,
          current_page: 1,
        });

        response = await request(app.getHttpServer())
          .get(`/api/apps`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        ({ meta, apps } = response.body);
        appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(new Set([anotherApplication.name]));
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 1,
          folder_count: 0,
          current_page: 1,
        });

        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=another`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        ({ meta, apps } = response.body);
        appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(new Set([anotherApplication.name]));
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 1,
          folder_count: 0,
          current_page: 1,
        });

        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=public`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        ({ meta, apps } = response.body);
        appNames = apps.map((app) => app.name);

        expect(apps).toEqual([]);
        expect(meta).toEqual({
          total_pages: 0,
          total_count: 0,
          folder_count: 0,
          current_page: 1,
        });

        loggedUser = await authenticateUser(app, superAdminUserData.user.email);
        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=public`)
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
        await logoutUser(
          app,
          anotherOrgAdminUserData['tokenCookie'],
          anotherOrgAdminUserData.user.defaultOrganizationId
        );
      });
    });

    describe('with folder', () => {
      it('should return all permissible apps with metadata within folder', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        const organization = adminUserData.organization;
        const folder = await getManager().save(Folder, {
          name: 'Folder',
          organizationId: adminUserData.organization.id,
        });
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users', 'developer'],
          organization,
        });
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['all_users', 'developer'],
          userType: 'instance',
        });
        loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;
        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await createApplication(app, {
          name: 'Another organization App',
          user: anotherOrgAdminUserData.user,
        });

        const nonPermissibleApp = await createApplication(
          app,
          {
            name: 'Non Permissible App',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: nonPermissibleApp.id }, { read: false });

        const publicApp = await createApplication(
          app,
          {
            name: 'Public App',
            user: adminUserData.user,
            isPublic: true,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: publicApp.id }, { read: false });

        await createApplication(
          app,
          {
            name: 'Owned App',
            user: developerUserData.user,
          },
          false
        );
        const appNotInfolder = await createApplication(
          app,
          {
            name: 'App not in folder',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: appNotInfolder.id }, { read: true });
        const appInFolder = await createApplication(
          app,
          {
            name: 'App in folder',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: appInFolder.id }, { read: true });
        await getManager().save(FolderApp, {
          app: appInFolder,
          folder: folder,
        });

        const publicAppInFolder = await createApplication(
          app,
          {
            name: 'Public App in Folder',
            user: adminUserData.user,
            isPublic: true,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: publicAppInFolder.id }, { read: false });
        await getManager().save(FolderApp, {
          app: publicAppInFolder,
          folder: folder,
        });

        const nonPermissibleAppInFolder = await createApplication(
          app,
          {
            name: 'Non permissible App in folder',
            user: adminUserData.user,
          },
          false
        );
        await getManager().update(AppGroupPermission, { appId: nonPermissibleAppInFolder.id }, { read: false });
        await getManager().save(FolderApp, {
          app: nonPermissibleAppInFolder,
          folder: folder,
        });

        let response = await request(app.getHttpServer())
          .get(`/api/apps`)
          .query({ folder: folder.id, page: 1 })
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        let { meta, apps } = response.body;
        let appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(new Set([appInFolder.name, publicAppInFolder.name]));
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 5,
          folder_count: 2,
          current_page: 1,
        });

        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=public app in`)
          .query({ folder: folder.id, page: 1 })
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        ({ meta, apps } = response.body);
        appNames = apps.map((app) => app.name);

        expect(new Set(appNames)).toEqual(new Set([publicAppInFolder.name]));
        expect(meta).toEqual({
          total_pages: 1,
          total_count: 1,
          folder_count: 1,
          current_page: 1,
        });

        loggedUser = await authenticateUser(app, superAdminUserData.user.email);
        response = await request(app.getHttpServer())
          .get(`/api/apps?searchKey=public app in`)
          .query({ folder: folder.id, page: 1 })
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      });
    });
  });

  describe('POST /api/apps/:id/clone', () => {
    it('should be able to clone the app if user group is admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'App to clone',
        user: adminUserData.user,
      });

      await createApplicationVersion(app, application);

      let response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toBe(201);

      const appId = response.body.id;
      const clonedApplication = await App.findOneOrFail({ where: { id: appId } });
      expect(clonedApplication.name).toContain('App to clone');

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(clonedApplication.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(clonedApplication.name);
      expect(auditLog.actionType).toEqual('APP_CLONE');
      expect(auditLog.createdAt).toBeDefined();

      response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
      await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
      await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
    });

    it('should be able to clone the app if user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      const { application } = await generateAppDefaults(app, adminUserData.user, {
        dsOptions: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
        name: 'App to clone',
      });

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );
      const response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(201);

      const appId = response.body.id;
      const clonedApplication = await App.findOneOrFail({ where: { id: appId } });
      expect(clonedApplication.name).toContain('App to clone');

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(clonedApplication.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(clonedApplication.name);
      expect(auditLog.actionType).toEqual('APP_CLONE');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should not be able to clone the app if app is of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app, 'another@tooljet.io');

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);

      await logoutUser(app, loggedUser.tokenCookie, anotherOrgAdminUserData.user.defaultOrganizationId);
    });
  });

  describe('PUT /api/apps/:id', () => {
    it('should be able to update name of the app if admin of same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app);

      const application = await createApplication(app, {
        user: adminUserData.user,
        name: 'old name',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ app: { name: 'new name' } });

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.name).toBe('new name');

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual('old name');
      expect(auditLog.actionType).toEqual('APP_UPDATE');
      expect(auditLog.metadata).toEqual({
        updateParams: { app: { name: 'new name' } },
      });
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should be able to update name of the app if the user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const application = await createApplication(app, {
        user: adminUserData.user,
        name: 'old name',
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .send({ app: { name: 'new name' } })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.name).toBe('new name');

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual('old name');
      expect(auditLog.actionType).toEqual('APP_UPDATE');
      expect(auditLog.metadata).toEqual({
        updateParams: { app: { name: 'new name' } },
      });
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should not be able to update name of the app if admin of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const loggedUser = await authenticateUser(app, 'another@tooljet.io');

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ app: { name: 'new name' } });

      expect(response.statusCode).toBe(403);
      await application.reload();
      expect(application.name).toBe('name');

      await logoutUser(app, loggedUser.tokenCookie, anotherOrgAdminUserData.user.defaultOrganizationId);
    });

    it('should not allow custom groups without app create permission to change the name of apps', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      let loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send({ app: { name: 'new name' } });
      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({ app: { name: 'new name' } });
      expect(response.statusCode).toBe(403);

      await application.reload();
      expect(application.name).toBe('name');

      await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
      await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
    });
  });

  describe('DELETE delete app', () => {
    it('should be possible for the admin to delete an app, cascaded with its versions, queries, data sources and comments', async () => {
      const admin = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app);
      admin['tokenCookie'] = loggedUser.tokenCookie;

      const { user } = await createUser(app, {
        firstName: 'mention',
        lastName: 'user',
        email: 'user@tooljet.io',
        groups: ['all_users'],
        organization: admin.organization,
      });
      const application = await createApplication(app, {
        name: 'AppTObeDeleted',
        user: admin.user,
      });
      const version = await createApplicationVersion(app, application);

      const dataSource = await createDataSource(app, {
        appVersion: version,
        kind: 'test_kind',
        name: 'test_name',
      });

      const dataQuery = await createDataQuery(app, {
        dataSource,
      });

      const threadResponse = await request(app.getHttpServer())
        .post(`/api/threads`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin['tokenCookie'])
        .send({
          appId: application.id,
          appVersionsId: version.id,
          x: 54.72136222910217,
          y: 405,
        });
      expect(threadResponse.statusCode).toBe(201);

      const thread = threadResponse.body;

      const commentsResponse = await request(app.getHttpServer())
        .post(`/api/comments`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin['tokenCookie'])
        .send({
          threadId: thread.id,
          comment: '(@mention user) ',
          appVersionsId: version.id,
          mentionedUsers: [user.id],
        });
      expect(commentsResponse.statusCode).toBe(201);

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin['tokenCookie']);

      expect(response.statusCode).toBe(200);

      await expect(App.findOneOrFail({ where: { id: application.id } })).rejects.toThrow(expect.any(Error));
      await expect(AppVersion.findOneOrFail({ where: { id: version.id } })).rejects.toThrow(expect.any(Error));
      await expect(DataQuery.findOneOrFail({ where: { id: dataQuery.id } })).rejects.toThrow(expect.any(Error));
      await expect(DataSource.findOneOrFail({ where: { id: dataSource.id } })).rejects.toThrow(expect.any(Error));
      await expect(AppUser.findOneOrFail({ where: { appId: application.id } })).rejects.toThrow(expect.any(Error));

      await logoutUser(app, admin['tokenCookie'], admin.user.defaultOrganizationId);
    });

    it('should be possible for app creator to delete an app', async () => {
      const developer = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
      });

      const loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developer['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'AppTObeDeleted',
        user: developer.user,
      });
      await createApplicationVersion(app, application);
      await createDataQuery(app, { application, kind: 'test_kind' });
      await createDataSource(app, {
        application,
        kind: 'test_kind',
        name: 'test_name',
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('tj-workspace-id', developer.user.defaultOrganizationId)
        .set('Cookie', developer['tokenCookie']);

      expect(response.statusCode).toBe(200);
      await expect(App.findOneOrFail({ where: { id: application.id } })).rejects.toThrow(expect.any(Error));

      await logoutUser(app, developer['tokenCookie'], developer.user.defaultOrganizationId);
    });

    it('should be possible for super admin to delete an app', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });
      const superAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      await createApplicationVersion(app, application);
      await createDataQuery(app, { application, kind: 'test_kind' });
      await createDataSource(app, {
        application,
        kind: 'test_kind',
        name: 'test_name',
      });

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      await expect(App.findOneOrFail({ where: { id: application.id } })).rejects.toThrow(expect.any(Error));
    });

    it('should not be possible for non admin to delete an app', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      await expect(App.findOneOrFail({ where: { id: application.id } })).resolves;
      await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
    });
  });

  describe('GET /api/apps/:id/users', () => {
    it('should allow only authenticated users to access app users endpoint', async () => {
      await request(app.getHttpServer()).get('/api/apps/uuid/users').expect(401);
    });
  });

  // TODO: Remove deprecated endpoint
  describe('/api/apps/:id/users', () => {
    xit('should not be able to fetch app users if admin of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app, 'another@tooljet.io');
      anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/users`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      await logoutUser(app, anotherOrgAdminUserData['tokenCookie'], anotherOrgAdminUserData.user.defaultOrganizationId);
    });

    xit('should be able to fetch app users if group is admin/developer/viewer of same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      for (const userData of [adminUserData, developerUserData, viewerUserData]) {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/users`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(response.body.users.length).toBe(1);
      }

      await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
      await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
    });
  });

  describe('GET /api/apps/:id/versions', () => {
    describe('authorization', () => {
      it('should be able to fetch app versions with app read permission group', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const organization = adminUserData.organization;
        const defaultUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users'],
          organization,
        });

        loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        defaultUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        await createApplicationVersion(app, application);

        const allUserGroup = await getRepository(GroupPermission).findOneOrFail({
          where: {
            group: 'all_users',
          },
        });
        await createAppGroupPermission(app, application, allUserGroup.id, {
          read: true,
          update: false,
          delete: false,
        });

        for (const userData of [adminUserData, defaultUserData]) {
          const response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', userData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie']);

          expect(response.statusCode).toBe(200);
          expect(response.body.versions.length).toBe(1);
        }
      });

      it('should be able to fetch app versions if the user is a super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          userType: 'instance',
        });

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        await createApplicationVersion(app, application);

        const loggedUser = await authenticateUser(
          app,
          superAdminUserData.user.email,
          'password',
          adminUserData.user.defaultOrganizationId
        );

        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/versions`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.versions.length).toBe(1);
      });

      it('should be able to fetch app versions only for specific environment', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const organization = adminUserData.organization;
        const defaultUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users'],
          organization,
        });

        loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        defaultUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });

        const appEnvironments = await getAllEnvironments(app, organization.id);
        const versionsEnvironmentMapping = [];
        appEnvironments.map(async (env) => {
          const version = await createApplicationVersion(app, application, { currentEnvironmentId: env.id });
          versionsEnvironmentMapping.push({
            [env.id]: [version.id],
          });
        });

        for (const userData of [adminUserData, defaultUserData]) {
          for (const item of versionsEnvironmentMapping) {
            const envId = Object.keys(item)[0];
            const response = await request(app.getHttpServer())
              .get(`/api/apps/${application.id}/versions?environment_id=${envId}`)
              .set('tj-workspace-id', userData.user.defaultOrganizationId)
              .set('Cookie', userData['tokenCookie']);

            expect(response.statusCode).toBe(200);
            expect(response.body.versions.length).toBe(1);
          }
        }
      });
    });

    describe('POST /api/apps/:id/versions', () => {
      describe('authorization', () => {
        it('should not be able to fetch app versions if user of another organization', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const anotherOrgAdminUserData = await createUser(app, {
            email: 'another@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          const loggedUser = await authenticateUser(app, 'another@tooljet.io');
          anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const application = await createApplication(app, {
            name: 'name',
            user: adminUserData.user,
          });
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
            .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

          expect(response.statusCode).toBe(403);

          await logoutUser(app, loggedUser.tokenCookie, anotherOrgAdminUserData.user.defaultOrganizationId);
        });

        it('should be able to create a new app version if group is admin or has app update permission group in same organization', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          let loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const developerUserData = await createUser(app, {
            email: 'dev@tooljet.io',
            groups: ['all_users', 'developer'],
            organization: adminUserData.organization,
          });

          loggedUser = await authenticateUser(app, 'dev@tooljet.io');
          developerUserData['tokenCookie'] = loggedUser.tokenCookie;

          const application = await createApplication(app, {
            user: adminUserData.user,
          });
          const version = await createApplicationVersion(app, application);
          // setup app permissions for developer
          const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
            where: {
              group: 'developer',
            },
          });
          await createAppGroupPermission(app, application, developerUserGroup.id, {
            read: false,
            update: true,
            delete: false,
          });

          const developementEnv = await getAppEnvironment(null, 1);

          for (const [index, userData] of [adminUserData, developerUserData].entries()) {
            const response = await request(app.getHttpServer())
              .post(`/api/apps/${application.id}/versions`)
              .set('tj-workspace-id', userData.user.defaultOrganizationId)
              .set('Cookie', userData['tokenCookie'])
              .send({
                versionName: `v_${index}`,
                versionFromId: version.id,
                environmentId: developementEnv.id,
              });

            expect(response.statusCode).toBe(201);
          }

          await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
          await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
        });

        it('should be able to create a new app version if the user is a super admin', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const superAdminUserData = await createUser(app, {
            email: 'dev@tooljet.io',
            groups: ['all_users', 'developer'],
            userType: 'instance',
          });
          const application = await createApplication(app, {
            user: adminUserData.user,
          });
          const version = await createApplicationVersion(app, application);

          const loggedUser = await authenticateUser(
            app,
            superAdminUserData.user.email,
            'password',
            adminUserData.user.defaultOrganizationId
          );

          const developmentEnv = await getAppEnvironment(null, 1);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie)
            .send({
              versionName: `v_3`,
              versionFromId: version.id,
              environmentId: developmentEnv.id,
            });

          expect(response.statusCode).toBe(201);
        });

        it('should be able to create a new app version from existing version', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
          });

          const loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const application = await createApplication(app, {
            user: adminUserData.user,
          });
          const v1 = await createApplicationVersion(app, application, {
            name: 'v1',
            definition: { foo: 'bar' },
          });

          const developementEnv = await getAppEnvironment(null, 1);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v2',
              versionFromId: v1.id,
              environmentId: developementEnv.id,
            });

          expect(response.statusCode).toBe(201);

          const v2 = await getManager().findOneOrFail(AppVersion, {
            where: { name: 'v2' },
          });
          expect(v2.definition).toEqual(v1.definition);

          await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        });

        it('should not be able to create app versions if user of another organization', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          let loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const anotherOrgAdminUserData = await createUser(app, {
            email: 'another@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          loggedUser = await authenticateUser(app, 'another@tooljet.io');
          anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const application = await createApplication(app, {
            name: 'name',
            user: adminUserData.user,
          });
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
            .set('Cookie', anotherOrgAdminUserData['tokenCookie'])
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(403);
          await logoutUser(
            app,
            anotherOrgAdminUserData['tokenCookie'],
            anotherOrgAdminUserData.user.defaultOrganizationId
          );
        });

        it('should not be able to create app versions if user does not have app create permission group', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          let loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const viewerUserData = await createUser(app, {
            email: 'viewer@tooljet.io',
            groups: ['all_users'],
            organization: adminUserData.organization,
          });

          loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
          viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

          const application = await createApplication(app, {
            name: 'name',
            user: adminUserData.user,
          });
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
            .set('Cookie', viewerUserData['tokenCookie'])
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(403);
          await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
          await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
        });
      });

      describe('Data source and query versioning', () => {
        it('should be able create data sources and queries for each version creation', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          const loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const appEnvironments = await createAppEnvironments(app, adminUserData.user.organizationId);

          const application = await createApplication(
            app,
            {
              user: adminUserData.user,
            },
            false
          );

          //create first version and default app environments
          const version = await createApplicationVersion(app, application);

          const dataSource = await createDataSource(app, {
            name: 'name',
            kind: 'postgres',
            appVersion: version,
          });

          await Promise.all(
            appEnvironments.map(async (env) => {
              await createDataSourceOption(app, {
                dataSource,
                environmentId: env.id,
                options: [],
              });
            })
          );

          await createDataQuery(app, {
            dataSource,
            kind: 'restapi',
            options: { method: 'get' },
          });

          const manager = getManager();
          let dataSources = await manager.find(DataSource);
          let dataQueries = await manager.find(DataQuery, { relations: ['dataSource'] });
          expect(dataSources).toHaveLength(1);
          expect(dataQueries).toHaveLength(1);

          // first version creation associates existing data sources and queries to it
          expect(dataSources.map((s) => s.appVersionId).includes(version.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.dataSource.appVersionId).includes(version.id)).toBeTruthy();

          // subsequent version creation will copy and create new data sources and queries from previous version
          const version2 = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v2',
              versionFromId: version.id,
              environmentId: appEnvironments.find((env) => env.priority === 1)?.id,
            });

          dataSources = await manager.find(DataSource);
          dataQueries = await manager.find(DataQuery, { relations: ['dataSource'] });
          expect(dataSources).toHaveLength(2);
          expect(dataQueries).toHaveLength(2);
          expect(dataSources.map((s) => s.appVersionId).includes(version2.body.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.dataSource.appVersionId).includes(version2.body.id)).toBeTruthy();

          const version3 = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v3',
              versionFromId: version2.body.id,
              environmentId: appEnvironments.find((env) => env.priority === 1)?.id,
            });

          dataSources = await manager.find(DataSource);
          dataQueries = await manager.find(DataQuery, { relations: ['dataSource'] });
          expect(dataSources).toHaveLength(3);
          expect(dataQueries).toHaveLength(3);
          expect(dataSources.map((s) => s.appVersionId).includes(version3.body.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.dataSource.appVersionId).includes(version3.body.id)).toBeTruthy();

          // creating a new version from a non existing version id will throw error when more than 1 versions exist
          await createDataSource(app, {
            name: 'name',
            kind: 'postgres',
            application: application,
            user: adminUserData.user,
          });
          await createDataQuery(app, {
            application,
            dataSource,
            kind: 'restapi',
            options: { method: 'get' },
          });

          const version4 = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v4',
              versionFromId: 'a77b051a-dd48-4633-a01f-089a845d5f88',
              environmentId: appEnvironments.find((env) => env.priority === 1)?.id,
            });

          expect(version4.statusCode).toBe(500);
          await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        });

        //will fix this
        it('creates new credentials and copies cipher text on data source', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
          });

          const loggedUser = await authenticateUser(app);
          adminUserData['tokenCookie'] = loggedUser.tokenCookie;

          const { application, appVersion: initialVersion } = await generateAppDefaults(app, adminUserData.user, {
            dsOptions: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
          });

          let credentials = await getManager().find(Credential);
          const credential = credentials[0];
          credential.valueCiphertext = 'strongPassword';
          await getManager().save(credential);

          let response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v1',
            });

          expect(response.statusCode).toBe(400);
          expect(response.body.message).toBe('Version from should not be empty');

          const developmentEnv = await getAppEnvironment(null, 1);

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v1',
              versionFromId: initialVersion.id,
              environmentId: developmentEnv.id,
            });

          expect(response.statusCode).toBe(201);

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .send({
              versionName: 'v2',
              versionFromId: response.body.id,
              environmentId: developmentEnv.id,
            });
          const dataSources = await getManager().find(DataSource);
          const dataQueries = await getManager().find(DataQuery);

          expect(dataSources).toHaveLength(3);
          expect(dataQueries).toHaveLength(3);

          credentials = await getManager().find(Credential);
          expect([...new Set(credentials.map((c) => c.valueCiphertext))]).toContain('strongPassword');

          await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        });
      });
    });
    //deleted the definifion spec while with no versionFrom it will return 500 from server
  });

  describe('DELETE /api/apps/:id/versions/:versionId', () => {
    describe('authorization', () => {
      it('should not be able to delete app versions if user of another organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedUser = await authenticateUser(app, 'another@tooljet.io');
        anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(403);
        await logoutUser(
          app,
          anotherOrgAdminUserData['tokenCookie'],
          anotherOrgAdminUserData.user.defaultOrganizationId
        );
      });

      it('should able to delete app versions if user is a super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
          userType: 'instance',
        });
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        await createApplicationVersion(app, application);
        const duplicateVersion = await createApplicationVersion(app, application, { name: 'v123' });

        const loggedUser = await authenticateUser(
          app,
          superAdminUserData.user.email,
          'password',
          adminUserData.user.defaultOrganizationId
        );

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${duplicateVersion.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
      });

      it('should be able to delete an app version if group is admin or has app update permission group in same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          organization: adminUserData.organization,
        });

        loggedUser = await authenticateUser(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });

        const version1 = await createApplicationVersion(app, application);
        const version2 = await createApplicationVersion(app, application, { name: 'v2', definition: null });

        // setup app permissions for developer
        const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
          where: {
            group: 'developer',
          },
        });
        await createAppGroupPermission(app, application, developerUserGroup.id, {
          read: false,
          update: true,
          delete: false,
        });

        let response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version1.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version2.id}`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie']);

        expect(response.statusCode).toBe(403);

        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      });

      it('should not be able to delete app versions if user does not have app update permission group', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['all_users'],
          organization: adminUserData.organization,
        });

        const loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
          .set('Cookie', viewerUserData['tokenCookie']);

        expect(response.statusCode).toBe(403);
        await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
      });

      it('should not be able to delete released app version', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);
        await createApplicationVersion(app, application, { name: 'v2', definition: null });

        await getManager().update(App, { id: application.id }, { currentVersionId: version.id });

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie']);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('You cannot delete a released version');

        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
      });
    });
  });

  describe('GET /api/apps/:id/versions/:version_id', () => {
    describe('authorization', () => {
      it('should be able to get app version by users having app read permission within same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users'],
          organization: adminUserData.organization,
        });

        loggedUser = await authenticateUser(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const allUserGroup = await getRepository(GroupPermission).findOneOrFail({
          where: {
            group: 'all_users',
          },
        });
        await createAppGroupPermission(app, application, allUserGroup.id, {
          read: true,
          update: false,
          delete: false,
        });

        for (const userData of [adminUserData, developerUserData]) {
          const response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions/${version.id}`)
            .set('tj-workspace-id', userData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie']);

          expect(response.statusCode).toBe(200);
        }

        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      });

      it('should be able to get app version if the user is super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          userType: 'instance',
        });
        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const loggedUser = await authenticateUser(
          app,
          superAdminUserData.user.email,
          'password',
          adminUserData.user.defaultOrganizationId
        );

        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
      });

      it('should not be able to get app versions if user of another organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const loggedUser = await authenticateUser(app, 'another@tooljet.io');
        anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        expect(response.statusCode).toBe(403);
        await logoutUser(
          app,
          anotherOrgAdminUserData['tokenCookie'],
          anotherOrgAdminUserData.user.defaultOrganizationId
        );
      });
    });

    describe('PUT /api/apps/:id/versions/:version_id', () => {
      it('should be able to update app version if has group admin or app update permission group in same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        let loggedUser = await authenticateUser(app, 'admin@tooljet.io');
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          organization: adminUserData.organization,
        });

        loggedUser = await authenticateUser(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        // setup app permissions for developer
        const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
          where: { group: 'developer' },
        });
        await createAppGroupPermission(app, application, developerUserGroup.id, {
          read: false,
          update: true,
          delete: false,
        });

        let count = 0;

        for (const userData of [adminUserData, developerUserData]) {
          count++;
          const response = await request(app.getHttpServer())
            .put(`/api/apps/${application.id}/versions/${version.id}`)
            .set('tj-workspace-id', userData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie'])
            .send({
              name: 'test' + count,
              definition: { components: {} },
            });

          expect(response.statusCode).toBe(200);
          await version.reload();
        }

        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
        await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      });

      it('should be able to update the current version without new definition changes, even it is a released versions', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedUser = await authenticateUser(app, 'admin@tooljet.io');
        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        let response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser['tokenCookie'])
          .send({ appName: 'new', current_version_id: version.id });

        expect(response.statusCode).toBe(200);

        response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser['tokenCookie'])
          .send({ is_user_switched_version: true });

        expect(response.statusCode).toBe(200);
      });

      it('should not be able to update app version if no app create permission within same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const viewerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users'],
          organization: adminUserData.organization,
        });

        const loggedUser = await authenticateUser(app, 'dev@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
          .set('Cookie', viewerUserData['tokenCookie'])
          .send({
            name: 'test',
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(403);
        await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
      });

      it('should not be able to update app versions if user of another organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedUser = await authenticateUser(app, 'another@tooljet.io');
        anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie'])
          .send({
            name: 'test',
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(403);
        await logoutUser(
          app,
          anotherOrgAdminUserData['tokenCookie'],
          anotherOrgAdminUserData.user.defaultOrganizationId
        );
      });

      it('should not be able to update app versions if the version is already released', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);
        await getManager().update(App, application, { currentVersionId: version.id });

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({
            name: 'test',
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('You cannot update a released version');
        await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
      });

      it('should be able to release the app if the version is promoted to production', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const loggedUser = await authenticateUser(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const environments = await getAllEnvironments(app, adminUserData.organization.id);

        for (const appEnvironment of defaultAppEnvironments) {
          const currentEnv = environments.find((env) => env.name === appEnvironment.name);
          if (!appEnvironment.isDefault) {
            const response = await request(app.getHttpServer())
              .put(`/api/apps/${application.id}/versions/${version.id}`)
              .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
              .set('Cookie', adminUserData['tokenCookie'])
              .send({
                currentEnvironmentId: currentEnv.id,
              });

            expect(response.statusCode).toBe(200);
          } else {
            const response = await request(app.getHttpServer())
              .put(`/api/apps/${application.id}`)
              .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
              .set('Cookie', loggedUser.tokenCookie)
              .send({ app: { currentVersionId: version.id } });

            expect(response.statusCode).toBe(200);
          }
        }
      });
    });
  });

  /*
    Viewing app on app viewer
    All org users can launch an app
    Public apps can be launched by anyone ( even unauthenticated users )
    By view app endpoint, we assume the apps/slugs/:id endpoint
  */
  describe('GET /api/apps/slugs/:slug', () => {
    it('should be able to fetch app using slug if has read permission within an organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });
      await createApplicationVersion(app, application);
      // setup app permissions for developer
      const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
        where: {
          group: 'developer',
        },
      });
      await createAppGroupPermission(app, application, developerUserGroup.id, {
        read: true,
        update: true,
        delete: false,
      });
      // setup app permissions for viewer
      const viewerUserGroup = await getRepository(GroupPermission).findOneOrFail({
        where: {
          group: 'viewer',
        },
      });
      await createAppGroupPermission(app, application, viewerUserGroup.id, {
        read: true,
        update: false,
        delete: false,
      });

      for (const userData of [adminUserData, developerUserData, viewerUserData]) {
        const response = await request(app.getHttpServer())
          .get('/api/apps/slugs/foo')
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(200);
      }

      // should create audit log
      expect(await AuditLog.count()).toEqual(6);
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(application.name);
      expect(auditLog.actionType).toEqual('APP_VIEW');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should be able to fetch app using slug if the user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const superAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });
      await createApplicationVersion(app, application);

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );

      const response = await request(app.getHttpServer())
        .get('/api/apps/slugs/foo')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);
      expect(response.statusCode).toBe(200);

      // should create audit log
      expect(await AuditLog.count()).toEqual(2);
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(application.name);
      expect(auditLog.actionType).toEqual('APP_VIEW');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should not be able to fetch app using slug if member of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const loggedUser = await authenticateUser(app, 'another@tooljet.io');
      anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      await createApplicationVersion(app, application);
      const response = await request(app.getHttpServer())
        .get('/api/apps/slugs/foo')
        .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(401);

      await logoutUser(app, anotherOrgAdminUserData['tokenCookie'], anotherOrgAdminUserData.user.defaultOrganizationId);
    });

    it('should be able to fetch app using slug if a public app ( even if unauthenticated )', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
        isPublic: true,
      });
      await createApplicationVersion(app, application);

      const response = await request(app.getHttpServer()).get('/api/apps/slugs/foo');

      expect(response.statusCode).toBe(200);

      // Audit log not created for public app viewed
      const auditLog = await AuditLog.findOne({
        userId: adminUserData.user.id,
      });
      expect(auditLog).toBeUndefined();
    });
  });

  describe('GET /api/apps/:id/export', () => {
    it('should be able to export app if user has create permission within an organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      await createApplicationVersion(app, application);

      // setup app permissions for developer
      const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
        where: {
          group: 'developer',
        },
      });
      developerUserGroup.appCreate = true;
      await developerUserGroup.save();

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/export`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      for (const userData of [adminUserData, developerUserData]) {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/export`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(200);
        expect(response.body.appV2.id).toBe(application.id);
        expect(response.body.appV2.name).toBe(application.name);
        expect(response.body.appV2.isPublic).toBe(application.isPublic);
        expect(response.body.appV2.organizationId).toBe(application.organizationId);
      }

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(application.name);
      expect(auditLog.actionType).toEqual('APP_EXPORT');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should be able to export app if user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const superAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      await createApplicationVersion(app, application);

      // setup app permissions for developer
      const developerUserGroup = await getRepository(GroupPermission).findOneOrFail({
        where: {
          group: 'developer',
        },
      });
      developerUserGroup.appCreate = true;
      await developerUserGroup.save();

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.organizationId
      );

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/export`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.appV2.id).toBe(application.id);
      expect(response.body.appV2.name).toBe(application.name);
      expect(response.body.appV2.isPublic).toBe(application.isPublic);
      expect(response.body.appV2.organizationId).toBe(application.organizationId);

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(application.id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(application.name);
      expect(auditLog.actionType).toEqual('APP_EXPORT');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should not be able to export app if member of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedUser = await authenticateUser(app, 'another@tooljet.io');
      anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/export`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);
      await logoutUser(app, anotherOrgAdminUserData['tokenCookie'], anotherOrgAdminUserData.user.defaultOrganizationId);
    });

    it('should not be able to export app if it is a public app for an unauthenticated user', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
        isPublic: true,
      });

      const response = await request(app.getHttpServer()).get(`/api/apps/${application.id}/export`);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/apps/import', () => {
    it('should be able to import app only if user has admin group', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });
      await createApplicationVersion(app, application);

      for (const userData of [viewerUserData, developerUserData]) {
        const response = await request(app.getHttpServer())
          .post('/api/apps/import')
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(403);
      }

      const response = await request(app.getHttpServer())
        .post('/api/apps/import')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send({ name: 'Imported App' });

      expect(response.statusCode).toBe(201);

      const importedApp = await getManager().find(App, {
        name: response.body.name,
      });

      expect(importedApp).toHaveLength(1);

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(importedApp[0].id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(importedApp[0].name);
      expect(auditLog.actionType).toEqual('APP_IMPORT');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should be able to import app only if user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        userType: 'instance',
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });
      await createApplicationVersion(app, application);

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.user.defaultOrganizationId
      );

      const response = await request(app.getHttpServer())
        .post('/api/apps/import')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'Imported App' });

      expect(response.statusCode).toBe(201);

      const importedApp = await getManager().find(App, {
        name: response.body.name,
      });

      expect(importedApp).toHaveLength(1);

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'APP',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUserData.user.organizationId);
      expect(auditLog.resourceId).toEqual(importedApp[0].id);
      expect(auditLog.resourceType).toEqual('APP');
      expect(auditLog.resourceName).toEqual(importedApp[0].name);
      expect(auditLog.actionType).toEqual('APP_IMPORT');
      expect(auditLog.createdAt).toBeDefined();
    });
  });

  describe('PUT /api/apps/:id/icons', () => {
    it('should be able to update icon of the app if admin of same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        user: adminUserData.user,
      });

      const loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send({ icon: 'new-icon-name' });

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.icon).toBe('new-icon-name');
      await logoutUser(app, adminUserData['tokenCookie'], adminUserData.user.defaultOrganizationId);
    });

    it('should not be able to update icon of the app if admin of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const loggedUser = await authenticateUser(app, 'another@tooljet.io');
      anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', anotherOrgAdminUserData['tokenCookie'])
        .send({ icon: 'new-icon-name' });

      expect(response.statusCode).toBe(403);
      await application.reload();
      expect(application.icon).toBe(null);
      await logoutUser(app, anotherOrgAdminUserData['tokenCookie'], anotherOrgAdminUserData.user.defaultOrganizationId);
    });

    it('should able to update icon of the app if user is super admin', async () => {
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        name: 'name',
        user: anotherOrgAdminUserData.user,
      });

      const loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        anotherOrgAdminUserData.user.defaultOrganizationId
      );

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ icon: 'new-icon-name' });

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.icon).toBe('new-icon-name');
    });

    it('should not allow custom groups without app create permission to change the icons of apps', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      let loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send({ icon: 'new-icon' });
      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({ icon: 'new-icon' });
      expect(response.statusCode).toBe(403);

      await application.reload();
      expect(application.icon).toBe(null);

      await logoutUser(app, developerUserData['tokenCookie'], developerUserData.user.defaultOrganizationId);
      await logoutUser(app, viewerUserData['tokenCookie'], viewerUserData.user.defaultOrganizationId);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
