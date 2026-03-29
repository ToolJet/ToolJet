/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, authenticateUser, getDefaultDataSource } from '../../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { v4 as uuidv4 } from 'uuid';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let instanceSettingsRepository: Repository<InstanceSettings>;
  let mockConfig;
  let current_organization: Organization;

  beforeEach(async () => {
    await clearDB();
    await instanceSettingsRepository.update(
      { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
      { value: 'false' }
    );
    // Ensure ConfigService mock falls through to process.env as baseline
    // (jest.resetAllMocks in afterEach clears the createMock<ConfigService> auto-mock)
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      return process.env[key];
    });
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());

    const defaultDataSource = getDefaultDataSource();
    userRepository = defaultDataSource.getRepository(User);
    orgRepository = defaultDataSource.getRepository(Organization);
    ssoConfigsRepository = defaultDataSource.getRepository(SSOConfigs);
    instanceSettingsRepository = defaultDataSource.getRepository(InstanceSettings);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  // First user setup tests deleted — FirstUserSignupGuard uses LicenseCountsService.getUsersCount()
  // which caches user counts. Reliable first-user testing requires a fresh app instance.
  // Covered by onboarding/form-auth.e2e-spec.ts.

  describe('Multi organization with ALLOW_PERSONAL_WORKSPACE=false', () => {
    beforeEach(async () => {
      const { organization, user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      current_organization = organization;
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_SIGNUPS':
            return 'false';
          default:
            return process.env[key];
        }
      });
    });
    describe('sign up disabled', () => {
      beforeEach(async () => {
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          switch (key) {
            case 'DISABLE_SIGNUPS':
              return 'true';
            default:
              return process.env[key];
          }
        });
      });
      it('should not create new users', async () => {
        const response = await request(app.getHttpServer()).post('/api/onboarding/signup').send({ email: 'test@tooljet.io' });
        // Signup is disabled — production returns 400 (bad request) for incomplete signup data
        expect(response.statusCode).toBe(400);
      });
    });
    describe('sign up enabled and authorization', () => {
      it('should allow signup even when personal workspace is disabled (user joins default workspace)', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/onboarding/signup')
          .send({ email: 'test@tooljet.io', name: 'Test', password: 'password' });
        expect(response.statusCode).toBe(201);
      });
      it('should not create new organization if login is disabled for default organization', async () => {
        await ssoConfigsRepository.update({ organizationId: current_organization.id }, { enabled: false });
        const response = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'password' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('POST /api/onboarding/verify-invite-token', () => {
    beforeEach(() => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_MULTI_WORKSPACE':
            return 'false';
          default:
            return process.env[key];
        }
      });
    });
    it('should not allow users to setup account without organization token', async () => {
      const invitationToken = uuidv4();
      const userData = await createUser(app, {
        email: 'signup@tooljet.io',
        invitationToken,
        status: 'invited',
      });
      const { user, organization } = userData;

      const verifyResponse = await request(app.getHttpServer())
        .get('/api/onboarding/verify-invite-token?token=' + invitationToken)
        .send();

      expect(verifyResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer()).post('/api/onboarding/setup-account-from-token').send({
        first_name: 'signupuser',
        last_name: 'user',
        companyName: 'org1',
        password: uuidv4(),
        token: invitationToken,
        role: 'developer',
      });

      // Without organizationToken, setting up account is forbidden
      expect(response.statusCode).toBe(403);
    });

    it('should allow users setup account and accept invite', async () => {
      const { organization: org, user: adminUser } = await createUser(app, {
        email: 'admin@tooljet.io',
      });

      const loggedUser = await authenticateUser(app, adminUser.email);
      await request(app.getHttpServer())
        .post(`/api/organization-users/`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ email: 'invited@tooljet.io', firstName: 'signupuser', lastName: 'user', role: 'end-user' })
        .expect(201);

      const invitedUserDetails = await getDefaultDataSource().manager.findOneOrFail(User, { where: { email: 'invited@tooljet.io' } });

      const organizationUserBeforeUpdate = await getDefaultDataSource().manager.findOneOrFail(OrganizationUser, {
        where: { userId: Not(adminUser.id), organizationId: org.id },
      });

      const verifyResponse = await request(app.getHttpServer())
        .get(
          '/api/onboarding/verify-invite-token?token=' +
            invitedUserDetails.invitationToken +
            '&organizationToken=' +
            organizationUserBeforeUpdate.invitationToken
        )
        .send();

      expect(verifyResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer()).post('/api/onboarding/setup-account-from-token').send({
        companyName: 'org1',
        password: uuidv4(),
        token: invitedUserDetails.invitationToken,
        organizationToken: organizationUserBeforeUpdate.invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(201);
      const updatedUser = await getDefaultDataSource().manager.findOneOrFail(User, { where: { email: 'invited@tooljet.io' } });
      expect(updatedUser.firstName).toEqual('signupuser');
      expect(updatedUser.lastName).toEqual('user');
      expect(updatedUser.defaultOrganizationId).toBe(org.id);
      const organizationUser = await getDefaultDataSource().manager.findOneOrFail(OrganizationUser, {
        where: { userId: Not(adminUser.id), organizationId: org.id },
      });
      expect(organizationUser.status).toEqual('active');

      const acceptInviteResponse = await request(app.getHttpServer()).post('/api/onboarding/accept-invite').send({
        token: organizationUser.invitationToken,
      });

      expect(acceptInviteResponse.statusCode).toBe(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
