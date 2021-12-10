/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';
import { getConnection } from 'typeorm';

describe('users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    jest.setTimeout(10000);
  });

  describe('update user', () => {
    it('should allow users to update their firstName, lastName and password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const [firstName, lastName] = ['Daenerys', 'Targaryen', 'drogo666'];

      const response = await request(app.getHttpServer())
        .patch('/api/users/update')
        .set('Authorization', authHeaderForUser(user))
        .send({ firstName, lastName });

      expect(response.statusCode).toBe(200);

      await user.reload();

      expect(user.firstName).toEqual(firstName);
      expect(user.lastName).toEqual(lastName);
    });
  });

  afterAll(async () => {
    await getConnection().close();
    await app.close();
  });
});
