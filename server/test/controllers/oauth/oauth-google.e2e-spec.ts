import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, generateRedirectUrl } from '../../test.helper';
import { OAuth2Client } from 'google-auth-library';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';

describe('oauth controller', () => {
  let app: INestApplication;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let orgRepository: Repository<Organization>;

  const authResponseKeys = ['id', 'email', 'first_name', 'last_name', 'current_organization_id'].sort();

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app } = await createNestAppInstanceWithEnvMock());
    ssoConfigsRepository = app.get('SSOConfigsRepository');
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
        ssoConfigs: [{ sso: 'google', enabled: true, configs: { clientId: 'client-id' } }],
        enableSignUp: true,
      });
      current_organization = organization;
    });

    describe('Multi-Workspace', () => {
      describe('sign in via Google OAuth', () => {
        let sso_configs;
        const token = 'some-Token';
        beforeEach(() => {
          sso_configs = current_organization.ssoConfigs.find((conf) => conf.sso === 'google');
        });
        it('should return 401 if google sign in is disabled', async () => {
          await ssoConfigsRepository.update(sso_configs.id, { enabled: false });
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return 401 when the user does not exist and sign up is disabled', async () => {
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return 401 when the user does not exist domain mismatch', async () => {
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: sso_configs.configs.clientId,
          });

          const url = await generateRedirectUrl('ssouser@tooljet.io', current_organization);
          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and sign up is enabled', async () => {
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: sso_configs.configs.clientId,
          });

          const url = await generateRedirectUrl('ssouser@tooljet.io', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });
        it('should return redirect url when the user does not exist and name not available and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: '',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: sso_configs.configs.clientId,
          });

          const url = await generateRedirectUrl('ssouser@tooljet.io', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });
        it('should return login info when the user exist', async () => {
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: sso_configs.configs.clientId,
          });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
        });
        it('should return login info when the user exist but invited status', async () => {
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
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: sso_configs.configs.clientId,
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
