import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, authenticateUser, getDefaultDataSource } from '../test.helper';
import { User } from 'src/entities/user.entity';
const path = require('path');

describe('users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('PATCH /api/profile/password', () => {
    it('should allow users to update their password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const oldPassword = user.password;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .patch('/api/profile/password')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ currentPassword: 'password', newPassword: 'new password' });

      expect(response.statusCode).toBe(200);
      const updatedUser = await getDefaultDataSource().manager.findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.password).not.toEqual(oldPassword);
    });

    it('should not allow users to update their password if entered current password is wrong', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const oldPassword = user.password;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .patch('/api/profile/password')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          currentPassword: 'wrong password',
          newPassword: 'new password',
        });

      expect(response.statusCode).toBe(403);

      const updatedUser = await getDefaultDataSource().manager.findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.password).toEqual(oldPassword);
    });
  });

  describe('PATCH /api/profile', () => {
    it('should allow users to update their firstName and lastName', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const [firstName, lastName] = ['Daenerys', 'Targaryen'];

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .patch('/api/profile')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ first_name: firstName, last_name: lastName });

      expect(response.statusCode).toBe(200);

      const updatedUser = await getDefaultDataSource().manager.findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.firstName).toEqual(firstName);
      expect(updatedUser.lastName).toEqual(lastName);
    });
  });

  describe('PATCH /api/profile/avatar', () => {
    it('should allow users to add a avatar', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });

      const { user } = userData;
      const filePath = path.join(__dirname, '../__mocks__/avatar.png');

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .patch('/api/profile/avatar')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .attach('file', filePath);

      expect(response.statusCode).toBe(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
