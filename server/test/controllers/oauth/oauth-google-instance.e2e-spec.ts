import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, generateRedirectUrl } from '../../test.helper';
import { OAuth2Client } from 'google-auth-library';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';

describe('oauth controller', () => {
  let app: INestApplication;
  let orgRepository: Repository<Organization>;
  let mockConfig;

  const authResponseKeys = ['id', 'email', 'first_name', 'last_name', 'current_organization_id'].sort();

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    orgRepository = app.get('OrganizationRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('SSO Login', () => {
    let current_organization: Organization;
    beforeEach(async () => {
      const { organization } = await createUser(app, {
        email: 'anotherUser@tooljet.io',
      });
      current_organization = organization;
    });

    describe('Multi-Workspace instance level SSO', () => {
      beforeEach(() => {
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          switch (key) {
            case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
              return 'google-client-id';
            case 'SSO_GIT_OAUTH2_CLIENT_ID':
              return 'git-client-id';
            case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
              return 'git-secret';
            default:
              return process.env[key];
          }
        });
      });
      describe('sign in via Google OAuth', () => {
        const token = 'some-Token';
        it('Workspace Login - should return 401 when the user does not exist and sign up is disabled', async () => {
          await orgRepository.update(current_organization.id, { enableSignUp: false });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Workspace Login - should return 401 when inherit SSO is disabled', async () => {
          await orgRepository.update(current_organization.id, { inheritSSO: false });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Common Login - should return 401 when the user does not exist and sign up is disabled', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_DISABLE_SIGNUPS':
                return 'true';
              default:
                return process.env[key];
            }
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
        });

        it('Common Login - should return 401 when the user does not exist domain mismatch', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljet.io,tooljet.com';
              default:
                return process.env[key];
            }
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljett.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
        });

        it('Workspace Login - should return 401 when the user does not exist domain mismatch', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljett.io,tooljet.com';
              default:
                return process.env[key];
            }
          });
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljett.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Common Login - should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljet.io,tooljet.com';
              default:
                return process.env[key];
            }
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const redirect_url = await generateRedirectUrl('ssouser@tooljet.io');

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Workspace Login - should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com', enableSignUp: true });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const redirect_url = await generateRedirectUrl('ssouser@tooljet.io', current_organization);

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Common Login - should return redirect url when the user does not exist and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const redirect_url = await generateRedirectUrl('ssouser@tooljet.io');

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Workspace Login - should return redirect url when the user does not exist and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { enableSignUp: true });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const redirect_url = await generateRedirectUrl('ssouser@tooljet.io', current_organization);

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Common Login - should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotheruser1@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('Workspace Login - should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotheruser1@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, admin, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(admin).toBeFalsy();
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('Common Login - should return login info when the user exist but invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'invited',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotheruser1@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).not.toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('invited');
        });

        it('Workspace Login - should return login info when the user exist but invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'invited',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotheruser1@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/google')
            .send({ token, organizationId: current_organization.id });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('active');
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
