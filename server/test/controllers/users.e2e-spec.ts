import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';

describe('users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('update user', () => {
    it('should allow users to update their firstName, lastName and password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const [firstName, lastName] = ['Daenerys', 'Targaryen', 'drogo666'];

      const response = await request(app.getHttpServer())
        .patch('/users/update')
        .set('Authorization', authHeaderForUser(user))
        .send({ firstName, lastName });

      expect(response.statusCode).toBe(200);

      await user.reload();

      expect(user.firstName).toEqual(firstName);
      expect(user.lastName).toEqual(lastName);
    });
  });

  describe('change password', () => {
    it('should allow users to update their password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'password', newPassword: 'new password' });

      expect(response.statusCode).toBe(200);

      await user.reload();

      expect(user.password).not.toEqual(oldPassword);
    });

    it('should not allow users to update their password if entered current password is wrong', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'wrong password', newPassword: 'new password' });

      expect(response.statusCode).toBe(403);

      await user.reload();

      expect(user.password).toEqual(oldPassword);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
