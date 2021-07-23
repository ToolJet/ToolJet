import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createApplication, createUser, createNestAppInstance } from '../test.helper';

describe('apps controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to update app params', async () => {
    await request(app.getHttpServer()).put('/apps/uuid').expect(401);
  });

  it('should be able to update name of the app if admin of same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { user: adminUserData.user });

    const response = await request(app.getHttpServer())
      .put(`/apps/${application.id}`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ app: { name: 'new name' } });

    expect(response.statusCode).toBe(200);
    await application.reload();
    expect(application.name).toBe('new name');
  });

  it('should not be able to update name of the app if admin of another organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const response = await request(app.getHttpServer())
      .put(`/apps/${application.id}`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))
      .send({ app: { name: 'new name' } });

    expect(response.statusCode).toBe(403);
    await application.reload();
    expect(application.name).toBe('name');
    
  });

  it('should not allow developers and viewers to change the name of apps', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const developerUserData = await createUser(app, { email: 'dev@tooljet.io', role: 'developer', organization: adminUserData.organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization: adminUserData.organization });

    let response = await request(app.getHttpServer())
      .put(`/apps/${application.id}`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .send({ app: { name: 'new name' } });
    expect(response.statusCode).toBe(403);

    response = await request(app.getHttpServer())
      .put(`/apps/${application.id}`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .send({ app: { name: 'new name' } });
    expect(response.statusCode).toBe(403);

    await application.reload();
    expect(application.name).toBe('name');
  });

  it('should allow only authenticated users to access app users endpoint', async () => {
    await request(app.getHttpServer()).get('/apps/uuid/users').expect(401);
  });

  it('should not be able to fetch app users if admin of another organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const anotherOrgAdminUserData = await createUser(app, { email: 'another@tooljet.io', role: 'admin' });
    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    const response = await request(app.getHttpServer())
      .get(`/apps/${application.id}/users`)
      .set('Authorization', authHeaderForUser(anotherOrgAdminUserData.user))

    expect(response.statusCode).toBe(403);
    
  });

  it('should be able to fetch app users if admin/developer/viewer of same organization', async () => {

    const adminUserData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const organization = adminUserData.organization;
    const developerUserData = await createUser(app, { email: 'developer@tooljet.io', role: 'developer', organization });
    const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', role: 'viewer', organization });

    const application = await createApplication(app, { name: 'name', user: adminUserData.user });

    for( const userData of [adminUserData, developerUserData, viewerUserData]) {
      const response = await request(app.getHttpServer())
        .get(`/apps/${application.id}/users`)
        .set('Authorization', authHeaderForUser(userData.user))

      expect(response.statusCode).toBe(200);
      expect(response.body.users.length).toBe(1);
    }
    
  });

  afterAll(async () => {
    await app.close();
  });
});
