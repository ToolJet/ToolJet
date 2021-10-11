import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaderForUser,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createDataSource,
  createAppGroupPermission,
} from '../test.helper';
import { Credential } from 'src/entities/credential.entity';
import { getRepository } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';

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
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });

    const developerUserGroup = await getRepository(GroupPermission).findOne({
      group: 'developer',
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
      app_id: application.id,
    };

    for (const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/data_sources`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send(dataSourceParams);

      expect(response.statusCode).toBe(201);
    }

    // encrypted data source options will create credentials
    expect(await Credential.count()).toBe(2);

    // Should not update if viewer or if user of another org
    for (const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/data_sources`)
        .set('Authorization', authHeaderForUser(userData.user))
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
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const developerUserGroup = await getRepository(GroupPermission).findOne({
      group: 'developer',
    });
    await createAppGroupPermission(app, application, developerUserGroup.id, {
      read: false,
      update: true,
      delete: false,
    });
    const dataSource = await createDataSource(app, {
      name: 'name',
      options: [{ key: 'foo', value: 'bar', encrypted: 'true' }],
      kind: 'postgres',
      application: application,
      user: adminUserData.user,
    });

    // encrypted data source options will create credentials
    expect(await Credential.count()).toBe(1);

    for (const userData of [adminUserData, developerUserData]) {
      const newOptions = [
        { key: 'email', value: userData.user.email },
        { key: 'foo', value: 'baz', encrypted: 'true' },
      ];
      const response = await request(app.getHttpServer())
        .put(`/data_sources/${dataSource.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: newOptions,
        });

      expect(response.statusCode).toBe(200);
      await dataSource.reload();
      expect(dataSource.options['email']['value']).toBe(userData.user.email);
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
        .put(`/data_sources/${dataSource.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
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
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    await createDataSource(app, {
      name: 'name',
      kind: 'postgres',
      application: application,
      user: adminUserData.user,
    });

    const allUserGroup = await getRepository(GroupPermission).findOne({
      group: 'all_users',
      organizationId: adminUserData.organization.id,
    });
    await createAppGroupPermission(app, application, allUserGroup.id, {
      read: true,
      update: true,
      delete: false,
    });

    for (const userData of [adminUserData, developerUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/data_sources?app_id=${application.id}`)
        .set('Authorization', authHeaderForUser(userData.user));

      expect(response.statusCode).toBe(200);
      expect(response.body.data_sources.length).toBe(1);
    }

    // Forbidden if user of another organization
    const response = await request(app.getHttpServer())
      .get(`/data_sources?app_id=${application.id}`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user));

    expect(response.statusCode).toBe(403);
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
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const dataSource = await createDataSource(app, {
      name: 'name',
      options: [],
      kind: 'restapi',
      application: application,
      user: adminUserData.user,
    });

    // Should not update if user of another org
    const response = await request(app.getHttpServer())
      .post(`/data_sources/${dataSource.id}/authorize_oauth2`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
      .send({
        code: 'oauth-auth-code',
      });

    expect(response.statusCode).toBe(403);
  });
});
