import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, createFile, clearDB, createUser, createNestAppInstance } from '../test.helper';

describe('files controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should not allow un-authenticated users to fetch a file', async () => {
    await request(app.getHttpServer()).get('/api/files/2540333b-f6fe-42b7-857c-736f24f9b644').expect(401);
  });

  it('should allow only authenticated users to fetch a file', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io' });

    const { user } = userData;

    const file = await createFile(app);

    const response = await request(app.getHttpServer())
      .get(`/api/files/${file.id}`)
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
  });
});
