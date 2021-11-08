import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaderForUser,
  createThread,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createApplicationVersion,
} from '../test.helper';

describe('comment controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to list comments', async () => {
    await request(app.getHttpServer()).get('/comment/1234/all').expect(401);
  });

  it('should list all comments in a thread', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });

    const { user } = userData;

    const application = await createApplication(app, {
      name: 'App to clone',
      user,
    });

    const version = await createApplicationVersion(app, application);

    const thread = await createThread(app, {
      appId: application.id,
      x: 100,
      y: 200,
      userId: userData.user.id,
      organizationId: user.organization.id,
      appVersionsId: version.id,
    });

    const response = await request(app.getHttpServer())
      .get(`/comment/${thread.id}/all`)
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
  });

  it('should list all comments in an organization', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const { user } = userData;

    const response = await request(app.getHttpServer())
      .get(`/comment/${user.organization.id}/all`)
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
