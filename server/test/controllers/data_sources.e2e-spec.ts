import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createDataSource,
  createDataQuery,
  createAppGroupPermission,
  createApplicationVersion,
  generateAppDefaults,
  authenticateUser,
} from '../test.helper';
import { Credential } from 'src/entities/credential.entity';
import { getManager, getRepository } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { DataSource } from 'src/entities/data_source.entity';

describe('data sources controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should be able to create data sources only if user has admin group or app update permission in same organization', async () => {
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
      groups: ['all_users'],
      organization: adminUserData.organization,
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

    const { application, appVersion: applicationVersion } = await generateAppDefaults(app, adminUserData.user, {
      isDataSourceNeeded: false,
      isQueryNeeded: false,
    });

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

    const dataSourceParams = {
      name: 'name',
      options: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
      kind: 'postgres',
      app_version_id: applicationVersion.id,
    };

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_sources`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send(dataSourceParams);

      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.app_version_id).toBe(applicationVersion.id);
      expect(response.body.kind).toBe('postgres');
      expect(response.body.name).toBe('name');
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    }

    // encrypted data source options will create credentials
    expect(await Credential.count()).toBe(2);

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/api/data_sources`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send(dataSourceParams);

      expect(response.statusCode).toBe(403);
    }
  });

  it('should be able to update data sources only if user has group admin or app update permission in same organization', async () => {
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

    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

    const { application, dataSource } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
      dsOptions: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
      dsKind: 'postgres',
    });
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

    // encrypted data source options will create credentials
    expect(await Credential.count()).toBe(1);

    for (const userData of [adminUserData, developerUserData]) {
      const newOptions = [
        { key: 'email', value: userData.user.email },
        { key: 'foo', value: 'baz', encrypted: 'true' },
      ];
      const response = await request(app.getHttpServer())
        .put(`/api/data_sources/${dataSource.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          options: newOptions,
        });

      const updatedDs = await getManager()
        .createQueryBuilder(DataSource, 'data_source')
        .innerJoinAndSelect('data_source.dataSourceOptions', 'dataSourceOptions')
        .where('data_source.id = :dataSourceId', { dataSourceId: dataSource.id })
        .getOneOrFail();

      expect(response.statusCode).toBe(200);
      expect(updatedDs.dataSourceOptions[0].options['email']['value']).toBe(userData.user.email);
    }

    // new credentials will not be created upon data source update
    expect(await Credential.count()).toBe(1);

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const newOptions = [
        { key: 'email', value: userData.user.email },
        { key: 'foo', value: 'baz', encrypted: 'true' },
      ];
      const response = await request(app.getHttpServer())
        .put(`/api/data_sources/${dataSource.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          options: newOptions,
        });

      expect(response.statusCode).toBe(403);
    }
  });

  it('should be able to list (get) datasources for an app by all users of same organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      groups: ['all_users'],
      organization: adminUserData.organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['all_users'],
      organization: adminUserData.organization,
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

    const { application, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    const allUserGroup = await getRepository(GroupPermission).findOneOrFail({
      where: {
        group: 'all_users',
        organizationId: adminUserData.organization.id,
      },
    });
    await createAppGroupPermission(app, application, allUserGroup.id, {
      read: true,
      update: true,
      delete: false,
    });

    for (const userData of [adminUserData, developerUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/api/data_sources?app_version_id=${appVersion.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie']);

      expect(response.statusCode).toBe(200);
      expect(response.body.data_sources.length).toBe(1);
    }

    // Forbidden if user of another organization
    const response = await request(app.getHttpServer())
      .get(`/api/data_sources?app_version_id=${appVersion.id}`)
      .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
      .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

    expect(response.statusCode).toBe(403);
  });

  it('should be able to delete data sources of an app only if admin/developer of same organization', async () => {
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

    let loggedUser = await authenticateUser(app, adminUserData.user.email);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, developerUserData.user.email);
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, viewerUserData.user.email);
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
    loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);
    anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

    const { application, appVersion } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
      isDataSourceNeeded: false,
    });

    // setup app permissions for developer
    const developerUserGroup = await getRepository(GroupPermission).findOne({
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
      const dataSource = await createDataSource(app, {
        name: 'name',
        options: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
        kind: 'postgres',
        appVersion,
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/data_sources/${dataSource.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send();

      expect(response.statusCode).toBe(200);
    }

    // Should not delete if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const dataSource = await createDataSource(app, {
        name: 'name',
        options: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
        kind: 'postgres',
        appVersion,
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/data_sources/${dataSource.id}`)
        .set('tj-workspace-id', userData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send();

      expect(response.statusCode).toBe(403);
    }
  });

  it('should be able to a delete data sources from a specific version of an app', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });

    const appVersion1 = await createApplicationVersion(app, application);
    const dataSource1 = await createDataSource(app, {
      name: 'api',
      kind: 'restapi',
      appVersion: appVersion1,
    });

    await createDataQuery(app, {
      dataSource: dataSource1,
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    const appVersion2 = await createApplicationVersion(app, application, { name: 'v2', definition: null });
    const dataSource2 = await createDataSource(app, {
      name: 'api2',
      kind: 'restapi',
      appVersion: appVersion2,
    });

    const dataSource2Temp = dataSource2;

    const query2 = await createDataQuery(app, {
      name: 'restapi2',
      dataSource: dataSource2,
      options: {
        method: 'get',
        url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
        url_params: [],
        headers: [],
        body: [],
      },
    });

    const dataQuery2Temp = query2;

    const loggedUser = await authenticateUser(app, adminUserData.user.email);

    const response = await request(app.getHttpServer())
      .delete(`/api/data_sources/${dataSource1.id}`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie)
      .send();

    expect(response.statusCode).toBe(200);

    await dataSource2.reload();
    await query2.reload();

    expect(dataSource2.id).toBe(dataSource2Temp.id);
    expect(query2.id).toBe(dataQuery2Temp.id);
  });

  it('should be able to search data sources with application version id', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    const loggedUser = await authenticateUser(app, adminUserData.user.email);

    const { dataSource } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    let response = await request(app.getHttpServer())
      .get(`/api/data_sources?app_version_id=${dataSource.appVersionId}`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_sources.length).toBe(1);

    response = await request(app.getHttpServer())
      .get(`/api/data_sources?app_version_id=62929ad6-11ae-4655-bb3e-2d2465b58950`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie);

    expect(response.statusCode).toBe(500);
  });

  it('should not be able to authorize OAuth code for a REST API source if user of another organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const { dataSource } = await generateAppDefaults(app, adminUserData.user, {
      isQueryNeeded: false,
    });

    const loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);

    // Should not update if user of another org
    const response = await request(app.getHttpServer())
      .post(`/api/data_sources/${dataSource.id}/authorize_oauth2`)
      .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({
        code: 'oauth-auth-code',
      });

    expect(response.statusCode).toBe(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
