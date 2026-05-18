import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, getEntityRepository, ensureInstanceSSOConfigs, closeTestApp } from 'test-helper';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { User } from '@entities/user.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

/** @group platform */
describe('OAuthController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let configService: ConfigService;
    let instanceSettingsRepository: Repository<InstanceSettings>;
    let userRepository: Repository<User>;
    let orgUserRepository: Repository<OrganizationUser>;

    const token = 'some-Token';

    beforeAll(async () => {
      ({ app } = await initTestApp());
      configService = app.get(ConfigService);
      instanceSettingsRepository = getEntityRepository(InstanceSettings);
      userRepository = getEntityRepository(User);
      orgUserRepository = getEntityRepository(OrganizationUser);
      await ensureInstanceSSOConfigs();
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // ---------------------------------------------------------------------------
    // Instance SSO | non-super-admin flows
    // ---------------------------------------------------------------------------
    describe('POST /api/oauth/sign-in/:configId | Google instance SSO (non-super-admin)', () => {
      beforeEach(async () => {
        await instanceSettingsRepository.update(
          { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
          { value: 'false' }
        );
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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

      it('Should not login if user workspace status is invited', async () => {
        await createUser(app, {
          firstName: 'SSO',
          lastName: 'userExist',
          email: 'invited@tooljet.io',
          groups: ['end-user'],
          status: 'invited',
        });

        const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
        googleVerifyMock.mockImplementation(() => ({
          getPayload: () => ({
            sub: 'someSSOId',
            email: 'invited@tooljet.io',
            name: 'SSO User',
            hd: 'tooljet.io',
          }),
        }));

        await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
      });

      it('Should not login if user workspace status is archived', async () => {
        await createUser(app, {
          firstName: 'SSO',
          lastName: 'userExist',
          email: 'archived@tooljet.io',
          groups: ['end-user'],
          status: 'archived',
        });

        const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
        googleVerifyMock.mockImplementation(() => ({
          getPayload: () => ({
            sub: 'someSSOId',
            email: 'archived@tooljet.io',
            name: 'SSO User',
            hd: 'tooljet.io',
          }),
        }));

        await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
      });
    });

    // ---------------------------------------------------------------------------
    // Instance SSO | super-admin flows
    // ---------------------------------------------------------------------------
    describe('POST /api/oauth/sign-in/:configId | Google instance SSO (super admin)', () => {
      let current_user: User;

      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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

      describe('Setup first user', () => {
        it('First user should be super admin', async () => {
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

          expect(response.statusCode).toBe(201);
          expect(response.body.email).toBe('ssouser@tooljet.io');
          expect(response.body.super_admin).toBe(false);
        });

        it('Second user should not be super admin', async () => {
          await createUser(app, {
            email: 'anotherUser@tooljet.io',
            userType: 'instance',
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

          expect(response.statusCode).toBe(201);
          expect(response.body.email).toBe('ssouser@tooljet.io');
          expect(response.body.super_admin).toBe(false);
        });
      });

      describe('sign in via Google OAuth', () => {
        beforeAll(async () => {
          const { user } = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
          });
          current_user = user;
        });

        it('Workspace Login - should return 201 when the super admin log in', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const orgCount = await orgUserRepository.count({ where: { userId: current_user.id } });
          expect(orgCount).toBe(1);
        });

        it('Workspace Login - should return 401 when the super admin status is archived', async () => {
          await userRepository.update({ email: 'superadmin@tooljet.io' }, { status: 'archived' });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'superadmin@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(406);
        });

        it('Workspace Login - should return 201 when the super admin status is invited in the organization', async () => {
          const adminUser = await userRepository.findOneOrFail({
            where: { email: 'superadmin@tooljet.io' },
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });
        });

        it('Workspace Login - should return 201 when the super admin status is archived in the organization', async () => {
          const adminUser = await userRepository.findOneOrFail({
            where: { email: 'superadmin@tooljet.io' },
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });
        });
      });
    });
  });
});
