import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance } from '../test.helper';
import { OAuth2Client } from 'google-auth-library';

describe('oauth controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('sign in via Google OAuth', () => {
    it('should return login info when the user does not exist', async () => {
      const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
      googleVerifyMock.mockImplementation(() => ({
        getPayload: () => ({
          sub: 'someSSOId',
          email: 'ssoUser@tooljet.io',
          name: 'SSO User',
          hd: 'tooljet.io',
        }),
      }));

      // Calling the createUser helper function to have an Organization created. This user is irrelevant for the test
      await createUser(app, { email: 'anotherUser@tooljet.io', role: 'admin' });

      const token = ['someStuff'];

      const response = await request(app.getHttpServer()).post('/api/oauth/sign-in').send({ token });

      expect(googleVerifyMock).toHaveBeenCalledWith({
        idToken: token,
        audience: expect.anything(),
      });

      expect(response.statusCode).toBe(201);
      expect(Object.keys(response.body).sort()).toEqual(
        [
          'id',
          'email',
          'first_name',
          'last_name',
          'auth_token',
          'admin',
          'group_permissions',
          'app_group_permissions',
        ].sort()
      );

      const { email, first_name, last_name, admin, group_permissions, app_group_permissions } = response.body;

      expect(email).toEqual('ssoUser@tooljet.io');
      expect(first_name).toEqual('SSO');
      expect(last_name).toEqual('User');
      expect(admin).toBeFalsy();
      expect(group_permissions).toHaveLength(1);
      expect(group_permissions[0].group).toEqual('all_users');
      expect(Object.keys(group_permissions[0]).sort()).toEqual(
        [
          'id',
          'organization_id',
          'group',
          'app_create',
          'app_delete',
          'updated_at',
          'created_at',
          'folder_create',
        ].sort()
      );
      expect(app_group_permissions).toHaveLength(0);
    });

    it('should be forbid logging in when the user does not exist and signups are disabled', async () => {
      process.env.SSO_DISABLE_SIGNUP = 'true';
      const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
      googleVerifyMock.mockImplementation(() => ({
        getPayload: () => ({
          sub: 'someSSOId',
          email: 'ssoUser@tooljet.io',
          name: 'SSO User',
          hd: 'tooljet.io',
        }),
      }));

      // Calling the createUser helper function to have an Organization created. This user is irrelevant for the test
      await createUser(app, { email: 'anotherUser@tooljet.io', role: 'admin' });

      const token = ['someStuff'];

      const response = await request(app.getHttpServer()).post('/api/oauth/sign-in').send({ token });

      expect(googleVerifyMock).toHaveBeenCalledWith({
        idToken: token,
        audience: expect.anything(),
      });

      expect(response.statusCode).toBe(401);
      process.env.SSO_DISABLE_SIGNUP = 'false';
    });

    it('should return login info when the user exists', async () => {
      const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
      googleVerifyMock.mockImplementation(() => ({
        getPayload: () => ({
          sub: 'someSSOId',
          email: 'ssoUser@tooljet.io',
          name: 'New name',
          hd: 'tooljet.io',
        }),
      }));

      await createUser(app, {
        email: 'ssoUser@tooljet.io',
        role: 'developer',
        ssoId: 'someSSOId',
        firstName: 'Existing',
        lastName: 'Name',
        groups: ['all_users', 'admin'],
      });

      const token = ['someStuff'];

      const response = await request(app.getHttpServer()).post('/api/oauth/sign-in').send({ token });

      expect(googleVerifyMock).toHaveBeenCalledWith({
        idToken: token,
        audience: expect.anything(),
      });

      expect(response.statusCode).toBe(201);
      expect(new Set(Object.keys(response.body))).toEqual(
        new Set([
          'id',
          'email',
          'first_name',
          'last_name',
          'auth_token',
          'admin',
          'group_permissions',
          'app_group_permissions',
        ])
      );

      const { email, first_name, last_name, admin, group_permissions, app_group_permissions } = response.body;

      expect(email).toEqual('ssoUser@tooljet.io');
      expect(first_name).toEqual('Existing');
      expect(last_name).toEqual('Name');
      expect(admin).toBeTruthy();
      expect(group_permissions).toHaveLength(2);
      expect(group_permissions.map((p) => p.group).sort()).toEqual(['all_users', 'admin'].sort());
      expect(Object.keys(group_permissions[0]).sort()).toEqual(
        [
          'id',
          'organization_id',
          'group',
          'app_create',
          'app_delete',
          'folder_create',
          'updated_at',
          'created_at',
        ].sort()
      );
      expect(app_group_permissions).toHaveLength(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
