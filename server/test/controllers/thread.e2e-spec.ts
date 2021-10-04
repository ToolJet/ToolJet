import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createApplication, createUser, createNestAppInstance } from '../test.helper';

describe('thread controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to list threads', async () => {
    await request(app.getHttpServer()).get('/thread/1234/all').expect(401);
  });

  it('should list all threads in an application', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const application = await createApplication(app, {
      name: 'App to clone',
      user: userData.user,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = userData;

    const response = await request(app.getHttpServer())
      .get(`/thread/${application.id}/all`)
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
