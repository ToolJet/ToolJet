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
} from '../test.helper';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { getManager, getRepository } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';

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

  describe('/api/apps/uuid', () => {
    it('should allow only authenticated users to update app params', async () => {
      await request(app.getHttpServer()).put('/api/apps/uuid').expect(401);
    });
  });

  describe('/api/apps', () => {
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
      const application = await App.findOne({ id: appId });

      expect(application.name).toBe('Untitled app');
      expect(application.id).toBe(application.slug);
    });
  });

  describe('/api/apps/:id/clone', () => {
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
      const clonedApplication = await App.findOne({ id: appId });
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

  describe('/api/apps/:id', () => {
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

    describe('delete app', () => {
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

        expect(await App.findOne(application.id)).toBeUndefined();
        expect(await AppVersion.findOne(version.id)).toBeUndefined();
        expect(await DataQuery.findOne(dataQuery.id)).toBeUndefined();
        expect(await DataSource.findOne(dataSource.id)).toBeUndefined();
        expect(await AppUser.findOne({ appId: application.id })).toBeUndefined();
      });

      it('should not be possible for non-admin user to delete an app, cascaded with its versions, queries and data sources', async () => {
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

        expect(response.statusCode).toBe(403);

        expect(await App.findOne(application.id)).not.toBeUndefined();
      });
    });
  });

  describe('/api/apps/uuid/users', () => {
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

  describe('/api/apps/:id/versions', () => {
    describe('get versions', () => {
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

          const allUserGroup = await getRepository(GroupPermission).findOne({
            group: 'all_users',
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
    });

    describe('create version', () => {
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

          // setup app permissions for developer
          const developerUserGroup = await getRepository(GroupPermission).findOne({
            group: 'developer',
          });
          await createAppGroupPermission(app, application, developerUserGroup.id, {
            read: false,
            update: true,
            delete: false,
          });

          for (const userData of [adminUserData, developerUserData]) {
            const response = await request(app.getHttpServer())
              .post(`/api/apps/${application.id}/versions`)
              .set('Authorization', authHeaderForUser(userData.user))
              .send({
                versionName: 'v0',
              });

            expect(response.statusCode).toBe(201);
          }
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

        it('should return previous version definition when previous versions exists', async () => {
          const adminUserData = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['all_users', 'admin'],
          });

          const application = await createApplication(app, {
            user: adminUserData.user,
          });

          const version = await createApplicationVersion(app, application);

          let response = await request(app.getHttpServer())
            .put(`/api/apps/${application.id}/versions/${version.id}`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              definition: { foo: 'bar' },
            });

          expect(response.statusCode).toBe(200);

          response = await request(app.getHttpServer())
            .post(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user))
            .send({
              versionName: 'v1',
            });

          expect(response.statusCode).toBe(201);

          response = await request(app.getHttpServer())
            .get(`/api/apps/${application.id}/versions`)
            .set('Authorization', authHeaderForUser(adminUserData.user));

          expect(response.statusCode).toBe(200);
          expect(response.body.versions['0']['name']).toBe('v1');
          expect(response.body.versions['0']['definition']).toMatchObject({
            foo: 'bar',
          });
        });
      });
    });
  });

  describe('/api/apps/:id/versions/:version_id', () => {
    describe('get app version', () => {
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

          const allUserGroup = await getRepository(GroupPermission).findOne({
            group: 'all_users',
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
    });

    describe('update app version', () => {
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
        const developerUserGroup = await getRepository(GroupPermission).findOne({ group: 'developer' });
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
    });
  });

  /*
    Viewing app on app viewer
    All org users can launch an app
    Public apps can be launched by anyone ( even unauthenticated users )
    By view app endpoint, we assume the apps/slugs/:id endpoint
  */
  describe('/api/apps/slugs/:slug', () => {
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
      // setup app permissions for developer
      const developerUserGroup = await getRepository(GroupPermission).findOne({
        group: 'developer',
      });
      await createAppGroupPermission(app, application, developerUserGroup.id, {
        read: true,
        update: true,
        delete: false,
      });
      // setup app permissions for viewer
      const viewerUserGroup = await getRepository(GroupPermission).findOne({
        group: 'viewer',
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
      await createApplication(app, {
        name: 'name',
        user: adminUserData.user,
        slug: 'foo',
      });

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

  describe('/api/apps/:id/export', () => {
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
      const developerUserGroup = await getRepository(GroupPermission).findOne({
        group: 'developer',
      });
      await createAppGroupPermission(app, application, developerUserGroup.id, {
        read: true,
        update: true,
        delete: false,
      });
      // setup app permissions for viewer
      const viewerUserGroup = await getRepository(GroupPermission).findOne({
        group: 'viewer',
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

    it('should be able to export app if it is a public app ( even if unauthenticated )', async () => {
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
      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(application.id);
      expect(response.body.name).toBe(application.name);
      expect(response.body.isPublic).toBe(application.isPublic);
      expect(response.body.organizationId).toBe(application.organizationId);
    });
  });

  describe('/api/apps/import', () => {
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

  afterAll(async () => {
    await app.close();
  });
});
