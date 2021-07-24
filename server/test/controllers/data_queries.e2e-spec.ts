import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createApplication, createUser, createNestAppInstance, createApplicationVersion, createDataQuery } from '../test.helper';

describe('data queries controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
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
