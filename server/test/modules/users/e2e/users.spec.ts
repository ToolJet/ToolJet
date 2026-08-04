import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, login, findEntityOrFail } from 'test-helper';
import { User } from 'src/entities/user.entity';
const path = require('path');

/** @group platform */
describe('UsersController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('PATCH /api/profile/password | Change password', () => {
      it('should allow users to update their password', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;

        const oldPassword = user.password;

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .patch('/api/profile/password')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({ currentPassword: 'password', newPassword: 'new password' });

        expect(response.statusCode).toBe(200);
        const updatedUser = await findEntityOrFail(User, { email: user.email } as any);
        expect(updatedUser.password).not.toEqual(oldPassword);
      });

      it('should not allow users to update their password if entered current password is wrong', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;

        const oldPassword = user.password;

        const loggedUser = await login(app);
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

        const updatedUser = await findEntityOrFail(User, { email: user.email } as any);
        expect(updatedUser.password).toEqual(oldPassword);
      });
    });

    describe('PATCH /api/profile | Update profile', () => {
      it('should allow users to update their firstName and lastName', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;

        const [firstName, lastName] = ['Daenerys', 'Targaryen'];

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .patch('/api/profile')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({ first_name: firstName, last_name: lastName });

        expect(response.statusCode).toBe(200);

        const updatedUser = await findEntityOrFail(User, { email: user.email } as any);
        expect(updatedUser).toMatchObject({
          firstName,
          lastName,
        });
      });
    });

    describe('PATCH /api/profile/avatar | Update avatar', () => {
      it('should allow users to add a avatar', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });

        const { user } = userData;
        const filePath = path.join(__dirname, '../__mocks__/avatar.png');

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .patch('/api/profile/avatar')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .attach('file', filePath);

        expect(response.statusCode).toBe(200);
      });

      it('should reject .exe file upload', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const filePath = path.join(__dirname, '../__mocks__/fake.exe');

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .patch('/api/profile/avatar')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .attach('file', filePath, { contentType: 'application/octet-stream' });

        expect(response.statusCode).toBe(400);
      });

      it('should reject file with spoofed image extension but exe content', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const filePath = path.join(__dirname, '../__mocks__/fake.exe');

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        const response = await request(app.getHttpServer())
          .patch('/api/profile/avatar')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .attach('file', filePath, { contentType: 'image/jpeg', filename: 'avatar.jpg' });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
