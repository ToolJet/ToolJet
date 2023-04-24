import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createThread,
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  createApplicationVersion,
  authenticateUser,
  logoutUser,
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
    await request(app.getHttpServer()).get('/api/comments/1234/all').expect(401);
  });

  it('should list all comments in a thread', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io' });

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
      organizationId: user.organizationId,
      appVersionsId: version.id,
    });

    const loggedUser = await authenticateUser(app, user.email);

    const response = await request(app.getHttpServer())
      .get(`/api/comments/${thread.id}/all`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie);

    expect(response.statusCode).toBe(200);

    await logoutUser(app, loggedUser.tokenCookie, user.defaultOrganizationId);
  });

  afterAll(async () => {
    await app.close();
  });
});
