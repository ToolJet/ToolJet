import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaderForUser,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createDataSource,
} from '../test.helper';
import { Credential } from 'src/entities/credential.entity';

describe('data sources controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should be able to create data sources of an app only if admin/developer of same organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization: adminUserData.organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization: adminUserData.organization,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      role: 'admin',
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
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

  it('should be able to update data sources of an app only if admin/developer of same organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization: adminUserData.organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization: adminUserData.organization,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      role: 'admin',
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
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

  it('should be able to list (get) datasources for an app only if admin/developer of same organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization: adminUserData.organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization: adminUserData.organization,
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      role: 'admin',
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dataSource = await createDataSource(app, {
      name: 'name',
      kind: 'postgres',
      application: application,
      user: adminUserData.user,
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
      role: 'admin',
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      role: 'admin',
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
