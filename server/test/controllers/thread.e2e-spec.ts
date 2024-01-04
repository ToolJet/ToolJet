import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createThread,
  createApplicationVersion,
  authenticateUser,
} from '../test.helper';

describe('thread controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to list threads', async () => {
    await request(app.getHttpServer()).get('/api/threads/1234/all').expect(401);
  });

  it('should list all threads in an application', async () => {
    const userData = await createUser(app, {
      email: 'admin@tooljet.io',
    });
    const application = await createApplication(app, {
      name: 'App',
      user: userData.user,
    });
    const { user } = userData;
    const version = await createApplicationVersion(app, application);
    await createThread(app, {
      appId: application.id,
      x: 100,
      y: 200,
      userId: userData.user.id,
      organizationId: user.organizationId,
      appVersionsId: version.id,
    });

    const loggedUser = await authenticateUser(app);
    userData['tokenCookie'] = loggedUser.tokenCookie;

    const response = await request(app.getHttpServer())
      .get(`/api/threads/${application.id}/all`)
      .query({ appVersionsId: version.id })
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', userData['tokenCookie']);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(Object.keys(response.body[0]).sort()).toEqual(
      ['id', 'x', 'y', 'appId', 'appVersionsId', 'userId', 'organizationId', 'isResolved', 'user', 'pageId'].sort()
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
