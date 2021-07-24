import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createApplication, createUser, createNestAppInstance, createApplicationVersion, createDataQuery, createDataSource } from '../test.helper';

describe('data queries controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should be able to update queries of an app only if admin/developer of same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const developerUserData = await createUser(app, { email: 'developer@tooljet.io', role: 'developer', organization: adminUserData.organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization: adminUserData.organization });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const dataQuery = await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method":"get","url":"https://api.github.com/repos/tooljet/tooljet/stargazers","url_params":[],"headers":[],"body":[] }
    });

    for(const userData of [adminUserData, developerUserData]) {
      const newOptions = { method: userData.user.email }
      const response = await request(app.getHttpServer())
        .patch(`/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: newOptions
        })

      expect(response.statusCode).toBe(200);
      await dataQuery.reload();
      expect(dataQuery.options.method).toBe(newOptions.method);
    }

    // Should not update if viewer or if user of another org
    for(const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const oldOptions = dataQuery.options;
      const response = await request(app.getHttpServer())
        .patch(`/data_queries/${dataQuery.id}`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send({
          options: { method: ''}
        })

      expect(response.statusCode).toBe(403);
      await dataQuery.reload();
      expect(dataQuery.options.method).toBe(oldOptions.method);
    }

  });

  it('should be able to get queries of an app only if the user belongs to the same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const developerUserData = await createUser(app, { email: 'developer@tooljet.io', role: 'developer', organization: adminUserData.organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization: adminUserData.organization });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });

    await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method": "get" }
    });

    for(const userData of [adminUserData, developerUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/data_queries?app_id=${application.id}`)
        .set('Authorization', authHeaderForUser(userData.user))

      expect(response.statusCode).toBe(200);
      expect(response.body.data_queries.length).toBe(1);
    }

    // Forbidden if user of another organization
    const response = await request(app.getHttpServer())
        .get(`/data_queries?app_id=${application.id}`)
        .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))

      expect(response.statusCode).toBe(403);

  });

  it('should be able to create queries for an app only if the user is admin/developer and belongs to the same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const developerUserData = await createUser(app, { email: 'developer@tooljet.io', role: 'developer', organization: adminUserData.organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization: adminUserData.organization });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });

    const queryParams = {
      app_id: application.id,
      kind: 'restapi',
      options: { "method": "get" }
    }

    for(const userData of [adminUserData, developerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/data_queries`)
        .set('Authorization', authHeaderForUser(userData.user))
        .send(queryParams)

      expect(response.statusCode).toBe(201);
    }

    // Forbidden if a viewer or a user of another organization
    for(const userData of [anotherOrgAdminUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
      .post(`/data_queries`)
      .set('Authorization', authHeaderForUser(userData.user))
      .send(queryParams)

      expect(response.statusCode).toBe(403);
    }

  });

  it('should not be able to create queries if datasource belongs to another app', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });
    const anotherApplication = await createApplication(app, { name: 'name', user: adminUserData.user });
    const dataSource = await createDataSource(app, { name: 'name', kind: 'postgres', application: application, user: adminUserData.user });

    let queryParams = {
      app_id: application.id,
      data_source_id: dataSource.id,
      kind: 'restapi',
      options: { "method": "get" }
    }

    // Create query if data source belongs to same app
    let response = await request(app.getHttpServer())
      .post(`/data_queries`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send(queryParams)

    expect(response.statusCode).toBe(201);

    queryParams = {
      app_id: anotherApplication.id,
      data_source_id: dataSource.id,
      kind: 'restapi',
      options: { "method": "get" }
    }

    // Fordbidden if data source belongs to another app
    response = await request(app.getHttpServer())
      .post(`/data_queries`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send(queryParams)

      expect(response.statusCode).toBe(403);
    
  });
  
  it('should be able to run queries of an app if the user belongs to the same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const developerUserData = await createUser(app, { email: 'developer@tooljet.io', role: 'developer', organization: adminUserData.organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization: adminUserData.organization });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const dataQuery = await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method":"get","url":"https://api.github.com/repos/tooljet/tooljet/stargazers","url_params":[],"headers":[],"body":[] }
    });

    for(const userData of [adminUserData, developerUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .post(`/data_queries/${dataQuery.id}/run`)
        .set('Authorization', authHeaderForUser(userData.user))

      expect(response.statusCode).toBe(201);
      expect(response.body.data.length).toBe(30);
    }

  });

  it('should not be able to run queries of an app if the user belongs to another organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const dataQuery = await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method":"get","url":"https://api.github.com/repos/tooljet/tooljet/stargazers","url_params":[],"headers":[],"body":[] }
    });

    const response = await request(app.getHttpServer())
      .post(`/data_queries/${dataQuery.id}/run`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))

    expect(response.statusCode).toBe(403);

  });

  it('should be able to run queries of an app if a public app ( even if an unauthenticated user )', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user, isPublic: true });
    const dataQuery = await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method":"get","url":"https://api.github.com/repos/tooljet/tooljet/stargazers","url_params":[],"headers":[],"body":[] }
     });

    const response = await request(app.getHttpServer())
      .post(`/data_queries/${dataQuery.id}/run`)

    expect(response.statusCode).toBe(201);
    expect(response.body.data.length).toBe(30);

  });

  it('should not be able to run queries if app not not public and user is not authenticated', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user, isPublic: false });
    const dataQuery = await createDataQuery(app, { 
      application,
      kind: 'restapi',
      options: { "method":"get","url":"https://api.github.com/repos/tooljet/tooljet/stargazers","url_params":[],"headers":[],"body":[] }
     });

    const response = await request(app.getHttpServer())
      .post(`/data_queries/${dataQuery.id}/run`)

    expect(response.statusCode).toBe(401);
  });


  afterAll(async () => {
    await app.close();
  });
});
