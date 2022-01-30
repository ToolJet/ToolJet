import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';
import { getManager } from 'typeorm';
import { User } from 'src/entities/user.entity';

describe('users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('change password', () => {
    it('should allow users to update their password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'password', newPassword: 'new password' });

      expect(response.statusCode).toBe(200);

      const updatedUser = await getManager().findOne(User, { where: { email: user.email } });
      expect(updatedUser.password).not.toEqual(oldPassword);
    });

    it('should not allow users to update their password if entered current password is wrong', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'wrong password', newPassword: 'new password' });

      expect(response.statusCode).toBe(403);

      const updatedUser = await getManager().findOne(User, { where: { email: user.email } });
      expect(updatedUser.password).toEqual(oldPassword);
    });
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

      const updatedUser = await getManager().findOne(User, { where: { email: user.email } });
      expect(updatedUser.firstName).toEqual(firstName);
      expect(updatedUser.lastName).toEqual(lastName);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
