import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createUser,
  createNestAppInstance,
  createDataQuery,
  createAppGroupPermission,
  generateAppDefaults,
  authenticateUser,
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
    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      groups: ['all_users', 'developer'],
      organization: adminUserData.organization,
    });
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['all_users', 'viewer'],
      organization: adminUserData.organization,
    });
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

    const { application, dataQuery } = await generateAppDefaults(app, adminUserData.user, {});

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

    for (const userData of [adminUserData, developerUserData]) {
      const newOptions = { method: userData.user.email };
      const response = await request(app.getHttpServer())
        .patch(`/api/data_queries/${dataQuery.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
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
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
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
    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
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
    const { application, dataSource, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

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
        dataSource,
        appVersion,
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
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          options: newOptions,
        });

      expect(response.statusCode).toBe(200);
    }

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const dataQuery = await createDataQuery(app, {
        dataSource,
        appVersion,
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
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
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
    const { application, dataSource, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

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
      dataSource,
      appVersion,
      kind: 'restapi',
      options: { method: 'get' },
    });

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/api/data_queries?app_version_id=${appVersion.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie']);

      expect(response.statusCode).toBe(200);
      expect(response.body.data_queries.length).toBe(1);
    }

    let response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_version_id=${appVersion.id}`)
      .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
      .set('Cookie', viewerUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);

    // Forbidden if user of another organization
    response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_version_id=${appVersion.id}`)
      .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
      .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

    expect(response.statusCode).toBe(403);
  });

  it('should be able to search queries with application version id', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const { dataSource, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    await createDataQuery(app, {
      dataSource,
      appVersion,
      kind: 'restapi',
      options: { method: 'get' },
    });

    const loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;

    let response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_version_id=${appVersion.id}`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', adminUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_queries.length).toBe(1);

    response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_version_id=62929ad6-11ae-4655-bb3e-2d2465b58950`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', adminUserData['tokenCookie']);

    expect(response.statusCode).toBe(500);
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
    const {
      application,
      dataSource,
      appVersion: applicationVersion,
    } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

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
      data_source_id: dataSource.id,
      kind: 'restapi',
      options: { method: 'get' },
      app_version_id: applicationVersion.id,
    };

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_queries`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send(requestBody);

      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.data_source_id).toBe(dataSource.id);
      expect(response.body.options).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    }

    // Forbidden if a viewer or a user of another organization
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_queries`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send(requestBody);

      expect(response.statusCode).toBe(403);
    }
  });

  it('should be able to get queries sorted created wise', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    const { dataSource, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    const options = {
      method: 'get',
      url: null,
      url_params: [['', '']],
      headers: [['', '']],
      body: [['', '']],
      json_body: null,
      body_toggle: false,
    };

    const createdQueries = [];
    const totalQueries = 15;

    const loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;

    for (let i = 1; i <= totalQueries; i++) {
      const queryParams = {
        name: `restapi${i}`,
        data_source_id: dataSource.id,
        kind: 'restapi',
        options,
        plugin_id: null,
        app_version_id: appVersion.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/data_queries`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send(queryParams);

      response.body['plugin'] = null;
      createdQueries.push(response.body);
    }

    // Latest query should be on top
    createdQueries.reverse();

    const response = await request(app.getHttpServer())
      .get(`/api/data_queries?app_version_id=${appVersion.id}`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', adminUserData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_queries.length).toBe(totalQueries);
    for (let i = 0; i < totalQueries; i++) {
      const responseObject = response.body.data_queries[i];
      const createdObject = createdQueries[i];
      expect(responseObject.id).toEqual(createdObject.id);
      expect(responseObject.name).toEqual(createdObject.name);
      expect(responseObject.options).toMatchObject(createdObject.options);
      expect(responseObject.created_at).toEqual(createdObject.created_at);
      expect(responseObject.updated_at).toEqual(createdObject.updated_at);
    }
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

    const { application, dataQuery } = await generateAppDefaults(app, adminUserData.user, {});

    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

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
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie']);

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

    const loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

    const { dataQuery } = await generateAppDefaults(app, adminUserData.user, {});
    const response = await request(app.getHttpServer())
      .post(`/api/data_queries/${dataQuery.id}/run`)
      .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
      .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

    expect(response.statusCode).toBe(403);
  });

  it('should be able to run queries of an app if a public app ( even if an unauthenticated user )', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const { dataQuery } = await generateAppDefaults(app, adminUserData.user, { isAppPublic: true });

    const response = await request(app.getHttpServer()).post(`/api/data_queries/${dataQuery.id}/run`);

    expect(response.statusCode).toBe(201);
    expect(response.body.data.length).toBe(30);
  });

  it('should not be able to run queries if app not not public and user is not authenticated', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const { dataQuery } = await generateAppDefaults(app, adminUserData.user, {});

    const response = await request(app.getHttpServer()).post(`/api/data_queries/${dataQuery.id}/run`);

    expect(response.statusCode).toBe(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
