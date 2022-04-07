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

  describe('PATCH /api/users/change_password', () => {
    it('should allow users to update their password', async () => {
      const userData = await createUser(app, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'password', newPassword: 'new password' });

      expect(response.statusCode).toBe(200);

      const updatedUser = await getManager().findOne(User, {
        where: { email: user.email },
      });
      expect(updatedUser.password).not.toEqual(oldPassword);
    });

    it('should not allow users to update their password if entered current password is wrong', async () => {
      const userData = await createUser(app, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({
          currentPassword: 'wrong password',
          newPassword: 'new password',
        });

      expect(response.statusCode).toBe(403);

      const updatedUser = await getManager().findOne(User, {
        where: { email: user.email },
      });
      expect(updatedUser.password).toEqual(oldPassword);
    });
  });

  describe('PATCH /api/users/update', () => {
    it('should allow users to update their firstName, lastName and password', async () => {
      const userData = await createUser(app, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const { user } = userData;

      const [firstName, lastName] = ['Daenerys', 'Targaryen'];

      const response = await request(app.getHttpServer())
        .patch('/api/users/update')
        .set('Authorization', authHeaderForUser(user))
        .send({ first_name: firstName, last_name: lastName });

      expect(response.statusCode).toBe(200);

      const updatedUser = await getManager().findOne(User, {
        where: { email: user.email },
      });
      expect(updatedUser.firstName).toEqual(firstName);
      expect(updatedUser.lastName).toEqual(lastName);
    });
  });

  describe('POST /api/users/set_password_from_token', () => {
    it('should allow users to set password from token', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const organization = adminUserData.organization;
      const anotherUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users'],
        invitationToken: 'token',
        organization,
      });

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'Khal',
        last_name: 'Drogo',
        token: 'token',
        organization: 'Dothraki Pvt Limited',
        password: 'Khaleesi',
        new_signup: true,
      });

      expect(response.statusCode).toBe(201);

      const updatedUser = await getManager().findOne(User, {
        where: { email: anotherUserData.user.email },
      });
      expect(updatedUser.firstName).toEqual('Khal');
      expect(updatedUser.lastName).toEqual('Drogo');
    });

    it('should return error if required params are not present', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        role: 'admin',
      });
      const organization = adminUserData.organization;
      await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['all_users'],
        invitationToken: 'token',
        organization,
      });

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toStrictEqual([
        'password should not be empty',
        'password must be a string',
        'token should not be empty',
        'token must be a string',
      ]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
