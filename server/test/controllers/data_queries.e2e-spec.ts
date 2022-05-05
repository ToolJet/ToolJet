import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaderForUser,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createDataQuery,
  createDataSource,
  createAppGroupPermission,
  createApplicationVersion,
} from '../test.helper';
import { getManager, getRepository } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';

describe('data queries controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should be able to update queries of an app only if group is admin or group has app update permission', async () => {
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
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
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

    const dataQuery = await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    for (const userData of [adminUserData, developerUserData]) {
      const newOptions = { method: userData.user.email };
      const response = await request(app.getHttpServer())
        .patch(`/api/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: newOptions,
        });

      expect(response.statusCode).toBe(200);
      await dataQuery.reload();
      expect(dataQuery.options.method).toBe(newOptions.method);
    }

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const oldOptions = dataQuery.options;
      const response = await request(app.getHttpServer())
        .patch(`/api/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: { method: '' },
        });

      expect(response.statusCode).toBe(403);
      await dataQuery.reload();
      expect(dataQuery.options.method).toBe(oldOptions.method);
    }
  });

  it('should be able to delete queries of an app only if admin/developer of same organization', async () => {
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
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
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

    for (const userData of [adminUserData, developerUserData]) {
      const dataQuery = await createDataQuery(app, {
        application,
        kind: 'restapi',
        options: {
          method: 'get',
          url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
          url_params: [],
          headers: [],
          body: [],
        },
      });
      const newOptions = { method: userData.user.email };

      const response = await request(app.getHttpServer())
        .delete(`/api/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: newOptions,
        });

      expect(response.statusCode).toBe(200);
    }

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const dataQuery = await createDataQuery(app, {
        application,
        kind: 'restapi',
        options: {
          method: 'get',
          url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
          url_params: [],
          headers: [],
          body: [],
        },
      });
      const oldOptions = dataQuery.options;

      const response = await request(app.getHttpServer())
        .delete(`/api/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: { method: '' },
        });

      expect(response.statusCode).toBe(403);
      await dataQuery.reload();
      expect(dataQuery.options.method).toBe(oldOptions.method);
    }
  });

  it('should be able to get queries only if the user has app read permission and belongs to the same organization', async () => {
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
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    const allUserGroup = await getManager().findOneOrFail(GroupPermission, {
      where: { group: 'all_users', organization: adminUserData.organization },
    });
    await getManager().update(
      AppGroupPermission,
      { app: application, groupPermissionId: allUserGroup },
      { read: true }
    );

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

    await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: { method: 'get' },
    });

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/api/data_queries?app_id=${application.id}`)
        .set('Authorization', authHeaderForUser(userData.user));

      expect(response.statusCode).toBe(200);
      expect(response.body.data_queries.length).toBe(1);
    }

    let response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_id=${application.id}`)
      .set('Authorization', authHeaderForUser(viewerUserData.user));

    expect(response.statusCode).toBe(200);

    // Forbidden if user of another organization
    response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_id=${application.id}`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

    expect(response.statusCode).toBe(403);
  });

  it('should be able to search queries with application version id', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const appVersion = await createApplicationVersion(app, application);
    await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: { method: 'get' },
      appVersion,
    });

    let response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_id=${application.id}&app_version_id=${appVersion.id}`)
      .set('Authorization', authHeaderForUser(adminUserData.user));

    expect(response.statusCode).toBe(200);
    expect(response.body.data_queries.length).toBe(1);

    response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_id=${application.id}&app_version_id=62929ad6-11ae-4655-bb3e-2d2465b58950`)
      .set('Authorization', authHeaderForUser(adminUserData.user));

    expect(response.statusCode).toBe(200);
    expect(response.body.data_queries.length).toBe(0);
  });

  it('should be able to create queries for an app only if the user has admin group or update permission', async () => {
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
    });
    const applicationVersion = await createApplicationVersion(app, application);
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
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

    const requestBody = {
      name: 'get query',
      app_id: application.id,
      kind: 'restapi',
      options: { method: 'get' },
      app_version_id: applicationVersion.id,
    };

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_queries`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send(requestBody);

      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.app_id).toBe(application.id);
      expect(response.body.app_version_id).toBe(applicationVersion.id);
      expect(response.body.options).toBeDefined();
      expect(response.body.kind).toBe('restapi');
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    }

    // Forbidden if a viewer or a user of another organization
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_queries`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send(requestBody);

      expect(response.statusCode).toBe(403);
    }
  });

  it('should not be able to create queries if datasource belongs to another app', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const anotherApplication = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const dataSource = await createDataSource(app, {
      name: 'name',
      kind: 'postgres',
      application: application,
      user: adminUserData.user,
    });

    const applicationVersion = await createApplicationVersion(app, application);

    let queryParams = {
      name: 'get query',
      app_id: application.id,
      data_source_id: dataSource.id,
      kind: 'restapi',
      options: { method: 'get' },
      app_version_id: applicationVersion.id,
    };

    // Create query if data source belongs to same app
    let response = await request(app.getHttpServer())
      .post(`/api/data_queries`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send(queryParams);

    expect(response.statusCode).toBe(201);

    queryParams = {
      name: 'get query',
      app_id: anotherApplication.id,
      data_source_id: dataSource.id,
      kind: 'restapi',
      options: { method: 'get' },
      app_version_id: applicationVersion.id,
    };

    // Fordbidden if data source belongs to another app
    response = await request(app.getHttpServer())
      .post(`/api/data_queries`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send(queryParams);

    expect(response.statusCode).toBe(403);
  });

  it('should be able to run queries of an app if the user belongs to the same organization', async () => {
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
    });

    const dataQuery = await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
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
        .post(`/api/data_queries/${dataQuery.id}/run`)
        .set('Authorization', authHeaderForUser(userData.user));

      expect(response.statusCode).toBe(201);
      expect(response.body.data.length).toBe(30);
    }
  });

  it('should not be able to run queries of an app if the user belongs to another organization', async () => {
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

    const dataQuery = await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/data_queries/${dataQuery.id}/run`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

    expect(response.statusCode).toBe(403);
  });

  it('should be able to run queries of an app if a public app ( even if an unauthenticated user )', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
      isPublic: true,
    });
    const dataQuery = await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    const response = await request(app.getHttpServer()).post(`/api/data_queries/${dataQuery.id}/run`);

    expect(response.statusCode).toBe(201);
    expect(response.body.data.length).toBe(30);
  });

  it('should not be able to run queries if app not not public and user is not authenticated', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
      isPublic: false,
    });
    const dataQuery = await createDataQuery(app, {
      application,
      kind: 'restapi',
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    const response = await request(app.getHttpServer()).post(`/api/data_queries/${dataQuery.id}/run`);

    expect(response.statusCode).toBe(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
