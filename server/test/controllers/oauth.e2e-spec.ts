import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

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
          hd: 'tooljet.io'
        })
      }));

      // Calling the createUser helper function to have an Organization created. This user is irrelevant for the test
      await createUser(app, { email: 'anotherUser@tooljet.io', role: 'admin' });
  
      const token = ['someStuff']
  
      const response = await request(app.getHttpServer())
        .post('/oauth/sign-in')
        .send({ token })

      expect(googleVerifyMock).toHaveBeenCalledWith({idToken: token, audience: expect.anything()});

      expect(response.statusCode).toBe(201);
      expect(response.body.email).toEqual('ssoUser@tooljet.io');
      expect(response.body.first_name).toEqual('SSO');
      expect(response.body.last_name).toEqual('User');
    });

    it('should return login info when the user exists', async () => {

      const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
      googleVerifyMock.mockImplementation(() => ({
        getPayload: () => ({
          sub: 'someSSOId',
          email: 'ssoUser@tooljet.io',
          name: 'New name',
          hd: 'tooljet.io'
        })
      }));

      await createUser(app, { email: 'ssoUser@tooljet.io', role: 'developer', ssoId : 'someSSOId', firstName: 'Existing', lastName: 'Name' });
  
      const token = ['someStuff']
  
      const response = await request(app.getHttpServer())
        .post('/oauth/sign-in')
        .send({ token });

      expect(googleVerifyMock).toHaveBeenCalledWith({idToken: token, audience: expect.anything()});
  
      expect(response.statusCode).toBe(201);
      expect(response.body.email).toEqual('ssoUser@tooljet.io');
      expect(response.body.first_name).toEqual('Existing');
      expect(response.body.last_name).toEqual('Name');
    });
  })
  
  afterAll(async () => {
    await app.close();
  });
});
