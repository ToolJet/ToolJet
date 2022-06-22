import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaderForUser,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  createAppGroupPermission,
  importAppFromTemplates,
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
import { Credential } from 'src/entities/credential.entity';

describe('apps controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    app.setGlobalPrefix('/api');
    await app.init();
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
        const organization = adminUserData.organization;
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users', 'developer'],
          organization,
        });
        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['all_users', 'viewer'],
          organization,
        });

        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        await createApplicationVersion(app, application);

        for (const userData of [viewerUserData, developerUserData]) {
          const response = await request(app.getHttpServer())
            .post(`/api/apps`)
            .set('Authorization', authHeaderForUser(userData.user));

          expect(response.statusCode).toBe(403);
        }

        const response = await request(app.getHttpServer())
          .post(`/api/apps`)
          .set('Authorization', authHeaderForUser(adminUserData.user));

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe('Untitled app');
      });
    });

    it('should create app with default values', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const response = await request(app.getHttpServer())
        .post(`/api/apps`)
        .set('Authorization', authHeaderForUser(adminUserData.user));

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('Untitled app');

      const appId = response.body.id;
      const application = await App.findOneOrFail({ where: { id: appId } });

      expect(application.name).toBe('Untitled app');
      expect(application.id).toBe(application.slug);
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

        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const anotherApplication = await createApplication(app, {
          name: 'Another organization App',
          user: anotherOrgAdminUserData.user,
        });

        const nonPermissibleApp = await createApplication(app, {
          name: 'Non Permissible App',
          user: adminUserData.user,
        });
        await getManager().update(AppGroupPermission, { appId: nonPermissibleApp.id }, { read: false });

        const publicApp = await createApplication(app, {
          name: 'Public App',
          user: adminUserData.user,
          isPublic: true,
        });
        await getManager().update(AppGroupPermission, { appId: publicApp.id }, { read: false });
        const ownedApp = await createApplication(app, {
          name: 'Owned App',
          user: developerUserData.user,
        });
        const appNotInFolder = await createApplication(app, {
          name: 'App not in folder',
          user: adminUserData.user,
        });
        await getManager().update(
          AppGroupPermission,
          { app: appNotInFolder, groupPermissionId: allUserGroup },
          { read: true }
        );
        const appInFolder = await createApplication(app, {
          name: 'App in folder',
          user: adminUserData.user,
        });
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
          .set('Authorization', authHeaderForUser(developerUserData.user));

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
          .set('Authorization', authHeaderForUser(developerUserData.user));

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
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

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
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

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
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

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
      });
    });

    describe('with folder', () => {
      it('should return all permissible apps with metadata within folder', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
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

        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await createApplication(app, {
          name: 'Another organization App',
          user: anotherOrgAdminUserData.user,
        });

        const nonPermissibleApp = await createApplication(app, {
          name: 'Non Permissible App',
          user: adminUserData.user,
        });
        await getManager().update(AppGroupPermission, { appId: nonPermissibleApp.id }, { read: false });

        const publicApp = await createApplication(app, {
          name: 'Public App',
          user: adminUserData.user,
          isPublic: true,
        });
        await getManager().update(AppGroupPermission, { appId: publicApp.id }, { read: false });

        await createApplication(app, {
          name: 'Owned App',
          user: developerUserData.user,
        });
        const appNotInfolder = await createApplication(app, {
          name: 'App not in folder',
          user: adminUserData.user,
        });
        await getManager().update(AppGroupPermission, { appId: appNotInfolder.id }, { read: true });
        const appInFolder = await createApplication(app, {
          name: 'App in folder',
          user: adminUserData.user,
        });
        await getManager().update(AppGroupPermission, { appId: appInFolder.id }, { read: true });
        await getManager().save(FolderApp, {
          app: appInFolder,
          folder: folder,
        });

        const publicAppInFolder = await createApplication(app, {
          name: 'Public App in Folder',
          user: adminUserData.user,
          isPublic: true,
        });
        await getManager().update(AppGroupPermission, { appId: publicAppInFolder.id }, { read: false });
        await getManager().save(FolderApp, {
          app: publicAppInFolder,
          folder: folder,
        });

        const nonPermissibleAppInFolder = await createApplication(app, {
          name: 'Non permissible App in folder',
          user: adminUserData.user,
        });
        await getManager().update(AppGroupPermission, { appId: nonPermissibleAppInFolder.id }, { read: false });
        await getManager().save(FolderApp, {
          app: nonPermissibleAppInFolder,
          folder: folder,
        });

        let response = await request(app.getHttpServer())
          .get(`/api/apps`)
          .query({ folder: folder.id, page: 1 })
          .set('Authorization', authHeaderForUser(developerUserData.user));

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
          .set('Authorization', authHeaderForUser(developerUserData.user));

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
      });
    });
  });

  describe('POST /api/apps/:id/clone', () => {
    it('should be able to clone the app if user group is admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      const application = await createApplication(app, {
        name: 'App to clone',
        user: adminUserData.user,
      });

      let response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('Authorization', authHeaderForUser(adminUserData.user));

      expect(response.statusCode).toBe(201);

      const appId = response.body.id;
      const clonedApplication = await App.findOneOrFail({ where: { id: appId } });
      expect(clonedApplication.name).toBe('App to clone');

      response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('Authorization', authHeaderForUser(developerUserData.user));

      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('Authorization', authHeaderForUser(viewerUserData.user));

      expect(response.statusCode).toBe(403);
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
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/apps/${application.id}/clone`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/apps/:id', () => {
    it('should be able to update name of the app if admin of same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ app: { name: 'new name' } });

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.name).toBe('new name');
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

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
        .send({ app: { name: 'new name' } });

      expect(response.statusCode).toBe(403);
      await application.reload();
      expect(application.name).toBe('name');
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
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      let response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send({ app: { name: 'new name' } });
      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send({ app: { name: 'new name' } });
      expect(response.statusCode).toBe(403);

      await application.reload();
      expect(application.name).toBe('name');
    });
  });

  describe('DELETE delete app', () => {
    it('should be possible for the admin to delete an app, cascaded with its versions, queries and data sources', async () => {
      const admin = await createUser(app, {
        email: 'adminForDelete@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const application = await createApplication(app, {
        name: 'AppTObeDeleted',
        user: admin.user,
      });
      const version = await createApplicationVersion(app, application);
      const dataQuery = await createDataQuery(app, {
        application,
        kind: 'test_kind',
      });
      const dataSource = await createDataSource(app, {
        application,
        kind: 'test_kind',
        name: 'test_name',
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(admin.user));

      expect(response.statusCode).toBe(200);

      await expect(App.findOneOrFail({ where: { id: application.id } })).rejects.toThrow(expect.any(Error));
      await expect(AppVersion.findOneOrFail({ where: { id: version.id } })).rejects.toThrow(expect.any(Error));
      await expect(DataQuery.findOneOrFail({ where: { id: dataQuery.id } })).rejects.toThrow(expect.any(Error));
      await expect(DataSource.findOneOrFail({ where: { id: dataSource.id } })).rejects.toThrow(expect.any(Error));
      await expect(AppUser.findOneOrFail({ where: { appId: application.id } })).rejects.toThrow(expect.any(Error));
    });

    it('should be possible for app creator to delete an app', async () => {
      const developer = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
      });
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
        .set('Authorization', authHeaderForUser(developer.user));

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

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${application.id}`)
        .set('Authorization', authHeaderForUser(developerUserData.user));

      expect(response.statusCode).toBe(403);

      await expect(App.findOneOrFail({ where: { id: application.id } })).resolves;
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
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/users`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

      expect(response.statusCode).toBe(403);
    });

    xit('should be able to fetch app users if group is admin/developer/viewer of same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization,
      });
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization,
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      for (const userData of [adminUserData, developerUserData, viewerUserData]) {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/users`)
          .set('Authorization', authHeaderForUser(userData.user));

        expect(response.statusCode).toBe(200);
        expect(response.body.users.length).toBe(1);
      }
    });
  });

  describe('GET /api/apps/:id/versions', () => {
    describe('authorization', () => {
      it('should be able to fetch app versions with app read permission group', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const organization = adminUserData.organization;
        const defaultUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users'],
          organization,
        });

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
            .set('Authorization', authHeaderForUser(userData.user));

          expect(response.statusCode).toBe(200);
          expect(response.body.versions.length).toBe(1);
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
          const application = await createApplication(app, {
            name: 'name',
            user: adminUserData.user,
          });
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

          expect(response.statusCode).toBe(403);
        });

        it('should be able to create a new app version if group is admin or has app update permission group in same organization', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const developerUserData = await createUser(app, {
            email: 'dev@tooljet.io',
            groups: ['all_users', 'developer'],
            organization: adminUserData.organization,
          });
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

          for (const [index, userData] of [adminUserData, developerUserData].entries()) {
            const response = await request(app.getHttpServer())
              .post(`/api/apps/${application.id}/versions`)
              .set('Authorization', authHeaderForUser(userData.user))
              .send({
                versionName: `v_${index}`,
                versionFromId: version.id,
              });

            expect(response.statusCode).toBe(201);
          }
        });

        it('should be able to create a new app version from existing version', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const application = await createApplication(app, {
            user: adminUserData.user,
          });
          const v1 = await createApplicationVersion(app, application, {
            name: 'v1',
            definition: { foo: 'bar' },
          });

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v2',
              versionFromId: v1.id,
            });

          expect(response.statusCode).toBe(201);

          const v2 = await getManager().findOneOrFail(AppVersion, {
            where: { name: 'v2' },
          });
          expect(v2.definition).toEqual(v1.definition);
        });

        it('should not be able to create app versions if user of another organization', async () => {
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
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(403);
        });

        it('should not be able to create app versions if user does not have app create permission group', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const viewerUserData = await createUser(app, {
            email: 'viewer@tooljet.io',
            groups: ['all_users'],
            organization: adminUserData.organization,
          });
          const application = await createApplication(app, {
            name: 'name',
            user: adminUserData.user,
          });
          await createApplicationVersion(app, application);

          const response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(viewerUserData.user))
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(403);
        });
      });

      describe('Data source and query versioning', () => {
        it('should be able create data sources and queries for each version creation', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const application = await createApplication(app, {
            user: adminUserData.user,
          });
          const dataSource = await createDataSource(app, {
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

          const manager = getManager();
          // data sources and queries without any version association
          let dataSources = await manager.find(DataSource);
          let dataQueries = await manager.find(DataQuery);

          expect(dataSources).toHaveLength(1);
          expect(dataQueries).toHaveLength(1);
          expect([...new Set(dataSources.map((s) => s.appVersionId))]).toEqual([null]);
          expect([...new Set(dataQueries.map((q) => q.appVersionId))]).toEqual([null]);

          let response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(201);

          // first version creation associates existing data sources and queries to it
          dataSources = await manager.find(DataSource);
          dataQueries = await manager.find(DataQuery);
          expect(dataSources).toHaveLength(1);
          expect(dataQueries).toHaveLength(1);
          expect(dataSources.map((s) => s.appVersionId).includes(response.body.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.appVersionId).includes(response.body.id)).toBeTruthy();

          // subsequent version creation will copy and create new data sources and queries from previous version
          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v1',
              versionFromId: response.body.id,
            });

          dataSources = await manager.find(DataSource);
          dataQueries = await manager.find(DataQuery);
          expect(dataSources).toHaveLength(2);
          expect(dataQueries).toHaveLength(2);
          expect(dataSources.map((s) => s.appVersionId).includes(response.body.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.appVersionId).includes(response.body.id)).toBeTruthy();

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v2',
              versionFromId: response.body.id,
            });

          dataSources = await manager.find(DataSource);
          dataQueries = await manager.find(DataQuery);
          expect(dataSources).toHaveLength(3);
          expect(dataQueries).toHaveLength(3);
          expect(dataSources.map((s) => s.appVersionId).includes(response.body.id)).toBeTruthy();
          expect(dataQueries.map((q) => q.appVersionId).includes(response.body.id)).toBeTruthy();

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

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v3',
              versionFromId: 'a77b051a-dd48-4633-a01f-089a845d5f88',
            });

          expect(response.statusCode).toBe(400);
          expect(response.body.message).toBe('More than one version found. Version to create from not specified.');
        });

        it('creates new credentials and copies cipher text on data source', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const application = await importAppFromTemplates(app, adminUserData.user, 'customer-dashboard');
          const dataSource = await getManager().findOneOrFail(DataSource, {
            where: { appId: application },
          });

          let dataSources = await getManager().find(DataSource);
          let dataQueries = await getManager().find(DataQuery);
          const credential = await getManager().findOneOrFail(Credential, {
            where: { id: dataSource.options['password']['credential_id'] },
          });
          credential.valueCiphertext = 'strongPassword';
          await getManager().save(credential);

          let response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v1',
            });

          expect(response.statusCode).toBe(400);
          expect(response.body.message).toBe('More than one version found. Version to create from not specified.');

          const initialVersion = await getManager().findOneOrFail(AppVersion, {
            where: { appId: application.id, name: 'v0' },
          });

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v1',
              versionFromId: initialVersion.id,
            });

          expect(response.statusCode).toBe(201);

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v2',
              versionFromId: response.body.id,
            });
          dataSources = await getManager().find(DataSource);
          dataQueries = await getManager().find(DataQuery);

          expect(dataSources).toHaveLength(3);
          expect(dataQueries).toHaveLength(6);

          const credentials = await getManager().find(Credential);
          expect([...new Set(credentials.map((c) => c.valueCiphertext))]).toEqual(['strongPassword']);
        });
      });

      describe('app definition', () => {
        it('should return null when no previous versions exists', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });
          const application = await createApplication(app, {
            user: adminUserData.user,
          });

          let response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v0',
            });

          expect(response.statusCode).toBe(201);

          response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user));

          expect(response.statusCode).toBe(200);
          expect(response.body.versions['0']['definition']).toBe(null);
        });
      });
    });
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
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

        expect(response.statusCode).toBe(403);
      });

      it('should be able to delete an app version if group is admin or has app update permission group in same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          organization: adminUserData.organization,
        });
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
          .set('Authorization', authHeaderForUser(adminUserData.user));

        expect(response.statusCode).toBe(200);

        response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version2.id}`)
          .set('Authorization', authHeaderForUser(developerUserData.user));

        expect(response.statusCode).toBe(200);
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
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(viewerUserData.user));

        expect(response.statusCode).toBe(403);
      });

      it('should not be able to delete released app version', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);
        await getManager().update(App, { id: application.id }, { currentVersionId: version.id });

        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(adminUserData.user));

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('You cannot delete a released version');
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
        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users'],
          organization: adminUserData.organization,
        });
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
            .set('Authorization', authHeaderForUser(userData.user));

          expect(response.statusCode).toBe(200);
        }
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

        const response = await request(app.getHttpServer())
          .get(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

        expect(response.statusCode).toBe(403);
      });
    });

    describe('PUT /api/apps/:id/versions/:version_id', () => {
      it('should be able to update app version if has group admin or app update permission group in same organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const developerUserData = await createUser(app, {
          email: 'dev@tooljet.io',
          groups: ['all_users', 'developer'],
          organization: adminUserData.organization,
        });
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

        for (const userData of [adminUserData, developerUserData]) {
          const response = await request(app.getHttpServer())
            .put(`/api/apps/${application.id}/versions/${version.id}`)
            .set('Authorization', authHeaderForUser(userData.user))
            .send({
              definition: { components: {} },
            });

          expect(response.statusCode).toBe(200);
          await version.reload();
        }
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
        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(viewerUserData.user))
          .send({
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(403);
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
        const application = await createApplication(app, {
          name: 'name',
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
          .send({
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(403);
      });

      it('should not be able to update app versions if the version is already released', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const application = await createApplication(app, {
          user: adminUserData.user,
        });
        const version = await createApplicationVersion(app, application);
        await getManager().update(App, application, { currentVersionId: version.id });

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${application.id}/versions/${version.id}`)
          .set('Authorization', authHeaderForUser(adminUserData.user))
          .send({
            definition: { components: {} },
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('You cannot update a released version');
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
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
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
          .set('Authorization', authHeaderForUser(userData.user));

        expect(response.statusCode).toBe(200);
      }
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
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      await createApplicationVersion(app, application);
      const response = await request(app.getHttpServer())
        .get('/api/apps/slugs/foo')
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

      expect(response.statusCode).toBe(403);
    });

    it('should be able to fetch app using slug if a public app ( even if unauthenticated )', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
        isPublic: true,
      });

      const response = await request(app.getHttpServer()).get('/api/apps/slugs/foo');

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/apps/:id/export', () => {
    it('should be able to export app if user has read permission within an organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });
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
          .get(`/api/apps/${application.id}/export`)
          .set('Authorization', authHeaderForUser(userData.user));

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(application.id);
        expect(response.body.name).toBe(application.name);
        expect(response.body.isPublic).toBe(application.isPublic);
        expect(response.body.organizationId).toBe(application.organizationId);
      }
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
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/apps/${application.id}/export`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

      expect(response.statusCode).toBe(403);
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
      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users', 'developer'],
        organization,
      });
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization,
      });

      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });
      await createApplicationVersion(app, application);

      for (const userData of [viewerUserData, developerUserData]) {
        const response = await request(app.getHttpServer())
          .post('/api/apps/import')
          .set('Authorization', authHeaderForUser(userData.user));

        expect(response.statusCode).toBe(403);
      }

      const response = await request(app.getHttpServer())
        .post('/api/apps/import')
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ name: 'Imported App' });

      expect(response.statusCode).toBe(201);

      const importedApp = await getManager().find(App, {
        name: 'Imported App',
      });

      expect(importedApp).toHaveLength(1);
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

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ icon: 'new-icon-name' });

      expect(response.statusCode).toBe(200);
      await application.reload();
      expect(application.icon).toBe('new-icon-name');
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
      const application = await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
      });

      const response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
        .send({ icon: 'new-icon-name' });

      expect(response.statusCode).toBe(403);
      await application.reload();
      expect(application.icon).toBe(null);
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
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      let response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send({ icon: 'new-icon' });
      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .put(`/api/apps/${application.id}/icons`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send({ icon: 'new-icon' });
      expect(response.statusCode).toBe(403);

      await application.reload();
      expect(application.icon).toBe(null);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
