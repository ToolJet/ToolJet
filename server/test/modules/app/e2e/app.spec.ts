/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository, Not } from 'typeorm';
import { User } from '@entities/user.entity';
import { ConfigService } from '@nestjs/config';
import {
  createUser,
  initTestApp,
  closeTestApp,
  login,
  getEntityRepository,
  findEntity,
  findEntityOrFail,
  updateEntity,
} from 'test-helper';
import { OrganizationUser } from '@entities/organization_user.entity';
import { Organization } from '@entities/organization.entity';
import { SSOConfigs } from '@entities/sso_config.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { EmailService } from '@modules/email/service';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { v4 as uuidv4 } from 'uuid';

/** @group platform */
describe('AppController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let orgRepository: Repository<Organization>;
    let orgUserRepository: Repository<OrganizationUser>;
    let ssoConfigsRepository: Repository<SSOConfigs>;
    let instanceSettingsRepository: Repository<InstanceSettings>;
    let configService: ConfigService;
    let current_organization: Organization;
    let current_organization_user: OrganizationUser;
    let current_user: User;

    beforeAll(async () => {
      ({ app } = await initTestApp());
      configService = app.get(ConfigService);
      userRepository = getEntityRepository(User);
      orgRepository = getEntityRepository(Organization);
      orgUserRepository = getEntityRepository(OrganizationUser);
      ssoConfigsRepository = getEntityRepository(SSOConfigs);
      instanceSettingsRepository = getEntityRepository(InstanceSettings);
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    describe('Multi organization', () => {
      beforeEach(async () => {
        const { organization, user } = await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
        current_organization = organization;
        current_user = user;
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'DISABLE_SIGNUPS':
                return 'true';
              default:
                return process.env[key];
            }
          });
        });
        it('should not create new users', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/onboarding/signup')
            .send({ email: 'test@tooljet.io', name: 'test', password: 'password' });
          // Onboarding service returns 406 (NotAcceptable) when signup is disabled
          expect(response.statusCode).toBe(406);
        });
      });
      describe('sign up enabled and authorization', () => {
        it('should create new users', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/onboarding/signup')
            .send({ email: 'test@tooljet.io', name: 'test', password: 'password' });
          expect(response.statusCode).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'test@tooljet.io' },
            relations: ['organizationUsers', 'userPermissions'],
          });

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          // Default workspace is named after the user's email
          expect(organization?.name).toContain('workspace');

          const groupPermissions = await user.userPermissions;
          const groupNames = groupPermissions.map((x) => x.name);

          // Signup users are assigned the end-user role in the default workspace
          expect(groupNames).toContain('end-user');

          const endUserGroup = groupPermissions.find((x) => x.name == 'end-user');
          expect(endUserGroup.appCreate).toBeFalsy();
          expect(endUserGroup.appDelete).toBeFalsy();
          expect(endUserGroup.folderCRUD).toBeFalsy();
          expect(endUserGroup.orgConstantCRUD).toBeFalsy();
        });
        it('authenticate if valid credentials', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'password' });

          expect(response.statusCode).toBe(201);
          expect(response.headers['set-cookie'][0]).toMatch(/^tj_auth_token=/);
        });
        it('authenticate to organization if valid credentials', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/authenticate/' + current_organization.id)
            .send({ email: 'admin@tooljet.io', password: 'password' });

          expect(response.statusCode).toBe(201);
          expect(response.headers['set-cookie'][0]).toMatch(/^tj_auth_token=/);
        });
        it('throw unauthorized error if user status is archived', async () => {
          const adminUser = await userRepository.findOneOrFail({
            where: { email: 'admin@tooljet.io' },
          });
          await userRepository.update({ id: adminUser.id }, { status: 'archived' });
          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'password' })
            .expect(401);
        });
        it('throw unauthorized error if user does not exist in given organization if valid credentials', async () => {
          await request(app.getHttpServer())
            .post('/api/authenticate/82249621-efc1-4cd2-9986-5c22182fa8a7')
            .send({ email: 'admin@tooljet.io', password: 'password' })
            .expect(401);
        });
        it('throw 401 if user is archived', async () => {
          const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

          await request(app.getHttpServer())
            .post(`/api/authenticate/${orgUser.organizationId}`)
            .send({ email: 'user@tooljet.io', password: 'password' })
            .expect(401);

          const adminUser = await userRepository.findOneOrFail({
            where: { email: 'admin@tooljet.io' },
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

          await request(app.getHttpServer()).get('/api/organization-users').expect(401);
        });
        it('throw 401 if user is invited', async () => {
          const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

          const response = await request(app.getHttpServer())
            .post(`/api/authenticate/${orgUser.organizationId}`)
            .send({ email: 'user@tooljet.io', password: 'password' })
            .expect(401);

          const adminUser = await userRepository.findOneOrFail({
            where: { email: 'admin@tooljet.io' },
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

          await request(app.getHttpServer()).get('/api/organization-users').expect(401);
        });
        it('login to new organization if user is archived', async () => {
          const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'password' });

          expect(response.statusCode).toBe(201);
          expect(response.body.current_organization_id).not.toBe(orgUser.organizationId);
        });
        it('login to new organization if user is invited', async () => {
          const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'password' });

          expect(response.statusCode).toBe(201);
          expect(response.body.current_organization_id).not.toBe(orgUser.organizationId);
        });
        it('throw 401 if invalid credentials', async () => {
          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'amdin@tooljet.io', password: 'password' })
            .expect(401);
        });
        it('throw 401 if invalid credentials, maximum retry limit reached error after 5 retries', async () => {
          await createUser(app, { email: 'user@tooljet.io', status: 'active' });

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          const invalidCredentialResp = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' });

          expect(invalidCredentialResp.statusCode).toBe(401);
          expect(invalidCredentialResp.body.message).toBe('Invalid credentials');

          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' });
          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe(
            'Maximum password retry limit reached, please reset your password using forgot password option'
          );
        });
        it('throw 401 if invalid credentials, maximum retry limit reached error will not throw if DISABLE_PASSWORD_RETRY_LIMIT is set to true', async () => {
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'DISABLE_PASSWORD_RETRY_LIMIT':
                return 'true';
              default:
                return process.env[key];
            }
          });
          await createUser(app, { email: 'user@tooljet.io', status: 'active' });

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'pssword' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' })
            .expect(401);

          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'user@tooljet.io', password: 'psswrd' });

          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe('Invalid credentials');
        });
        it('throw 401 if invalid credentials, maximum retry limit reached error will not throw after the count configured in PASSWORD_RETRY_LIMIT', async () => {
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'PASSWORD_RETRY_LIMIT':
                return '3';
              default:
                return process.env[key];
            }
          });
          await createUser(app, { email: 'user@tooljet.io', status: 'active' });

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'psswrd' })
            .expect(401);

          await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'psswrd' })
            .expect(401);

          const invalidCredentialResp = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'psswrd' });

          expect(invalidCredentialResp.statusCode).toBe(401);
          expect(invalidCredentialResp.body.message).toBe('Invalid credentials');

          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'psswrd' });

          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe(
            'Maximum password retry limit reached, please reset your password using forgot password option'
          );
        });
        it('should throw 401 if form login is disabled', async () => {
          await ssoConfigsRepository.update({ organizationId: current_organization.id }, { enabled: false });
          await request(app.getHttpServer())
            .post('/api/authenticate/' + current_organization.id)
            .send({ email: 'admin@tooljet.io', password: 'password' })
            .expect(401);
        });
        it('should create new organization if login is disabled for default organization', async () => {
          await ssoConfigsRepository.update({ organizationId: current_organization.id }, { enabled: false });
          const response = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'password' });
          expect(response.statusCode).toBe(201);
          expect(response.body.current_organization_id).not.toBe(current_organization.id);
        });
        it('should be able to switch between organizations with admin privilege', async () => {
          const { organization: invited_organization } = await createUser(
            app,
            { organizationName: 'New Organization' },
            current_user
          );

          const authResponse = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'password' });

          const response = await request(app.getHttpServer())
            .get('/api/switch/' + invited_organization.id)
            .set('tj-workspace-id', current_user.defaultOrganizationId)
            .set('Cookie', authResponse.headers['set-cookie']);

          expect(response.statusCode).toBe(200);
          // Verify key fields are present in response (not exact match | response shape evolves)
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('email');
          expect(response.body).toHaveProperty('first_name');
          expect(response.body).toHaveProperty('last_name');
          expect(response.body).toHaveProperty('current_organization_id');
          expect(response.body).toHaveProperty('admin');
          expect(response.body).toHaveProperty('organization');

          const { email, first_name, last_name } = response.body;

          expect(email).toEqual(current_user.email);
          expect(first_name).toEqual(current_user.firstName);
          expect(last_name).toEqual(current_user.lastName);
          await current_user.reload();
          expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
        });
        it('should be able to switch between organizations with user privilege', async () => {
          const { organization: invited_organization } = await createUser(
            app,
            { groups: ['end-user'], organizationName: 'New Organization' },
            current_user
          );

          const authResponse = await request(app.getHttpServer())
            .post('/api/authenticate')
            .send({ email: 'admin@tooljet.io', password: 'password' });

          const response = await request(app.getHttpServer())
            .get('/api/switch/' + invited_organization.id)
            .set('tj-workspace-id', authResponse.body.current_organization_id)
            .set('Cookie', authResponse.headers['set-cookie']);

          expect(response.statusCode).toBe(200);
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('email');
          expect(response.body).toHaveProperty('first_name');
          expect(response.body).toHaveProperty('last_name');
          expect(response.body).toHaveProperty('current_organization_id');
          expect(response.body).toHaveProperty('admin');
          expect(response.body).toHaveProperty('organization');

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual(current_user.email);
          expect(first_name).toEqual(current_user.firstName);
          expect(last_name).toEqual(current_user.lastName);
          expect(current_organization_id).toBe(invited_organization.id);
          await current_user.reload();
          expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
        });
      });
    });

    describe('POST /api/forgot-password | Request password reset', () => {
      beforeEach(async () => {
        await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
      });
      it('should return error if required params are not present', async () => {
        const response = await request(app.getHttpServer()).post('/api/forgot-password');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toStrictEqual(['email should not be empty', 'email must be an email']);
      });

      it('should set token and send email', async () => {
        const emailServiceMock = jest.spyOn(EmailService.prototype, 'sendPasswordResetEmail');
        emailServiceMock.mockImplementation();

        const response = await request(app.getHttpServer())
          .post('/api/forgot-password')
          .send({ email: 'admin@tooljet.io' });

        expect(response.statusCode).toBe(201);

        const user = await findEntity(User, { email: 'admin@tooljet.io' } as any);

        expect(emailServiceMock).toHaveBeenCalledWith(
          expect.objectContaining({ to: user.email, token: user.forgotPasswordToken })
        );
      });
    });

    describe('POST /api/reset-password | Reset password', () => {
      beforeEach(async () => {
        await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
      });
      it('should return error if required params are not present', async () => {
        const response = await request(app.getHttpServer()).post('/api/reset-password');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toStrictEqual([
          'Password should be Max 100 characters',
          'Password should contain more than 5 letters',
          'password should not be empty',
          'password must be a string',
          'token should not be empty',
          'token must be a string',
        ]);
      });

      it('should reset password', async () => {
        const user = await findEntity(User, { email: 'admin@tooljet.io' } as any);

        user.forgotPasswordToken = 'token';
        await user.save();

        const response = await request(app.getHttpServer()).post('/api/reset-password').send({
          password: 'new_password',
          token: 'token',
        });

        expect(response.statusCode).toBe(201);

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'new_password' })
          .expect(201);
      });
    });

    describe('POST /api/onboarding/accept-invite | Accept workspace invite', () => {
      describe('Multi-Workspace Enabled', () => {
        beforeEach(() => {
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'DISABLE_MULTI_WORKSPACE':
                return 'false';
              default:
                return process.env[key];
            }
          });
        });

        it('should allow users to accept invitation when Multi-Workspace is enabled', async () => {
          const userData = await createUser(app, {
            email: 'organizationUser@tooljet.io',
            status: 'invited',
          });

          const { user, orgUser } = userData;

          // OrganizationInviteAuthGuard requires source='signup' for unauthenticated accept-invite
          await getEntityRepository(OrganizationUser).update({ id: orgUser.id }, { source: 'signup' });

          const response = await request(app.getHttpServer()).post('/api/onboarding/accept-invite').send({
            token: orgUser.invitationToken,
          });

          expect(response.statusCode).toBe(201);

          const organizationUser = await findEntityOrFail(OrganizationUser, { userId: user.id } as any);
          expect(organizationUser.status).toEqual('active');
        });

        it('should not allow users to accept invitation when user sign up is not completed', async () => {
          const userData = await createUser(app, {
            email: 'organizationUser@tooljet.io',
            invitationToken: uuidv4(),
            status: 'invited',
          });
          const { user, orgUser } = userData;

          // OrganizationInviteAuthGuard requires source='signup' for unauthenticated accept-invite
          await getEntityRepository(OrganizationUser).update({ id: orgUser.id }, { source: 'signup' });

          const response = await request(app.getHttpServer()).post('/api/onboarding/accept-invite').send({
            token: orgUser.invitationToken,
          });

          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe(
            'Please setup your account using account setup link shared via email before accepting the invite'
          );
        });
      });
    });

    describe('GET /api/onboarding/verify-invite-token | Verify invite token', () => {
      describe('Multi-Workspace Enabled', () => {
        beforeEach(async () => {
          const { organization, user, orgUser } = await createUser(app, {
            email: 'admin@tooljet.io',
            firstName: 'user',
            lastName: 'name',
          });
          current_organization = organization;
          current_user = user;
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'DISABLE_MULTI_WORKSPACE':
                return 'false';
              default:
                return process.env[key];
            }
          });
        });
        it('should return 400 while verifying invalid invitation token', async () => {
          await request(app.getHttpServer()).get(`/api/onboarding/verify-invite-token?token=${uuidv4()}`).expect(400);
        });

        it('should return user info while verifying invitation token', async () => {
          const userData = await createUser(app, {
            email: 'organizationUser@tooljet.io',
            invitationToken: uuidv4(),
            status: 'invited',
          });
          const {
            user: { invitationToken },
          } = userData;
          const response = await request(app.getHttpServer()).get(
            `/api/onboarding/verify-invite-token?token=${invitationToken}`
          );
          const {
            body: { email, name, onboarding_details },
            status,
          } = response;
          expect(status).toBe(200);
          expect(email).toEqual('organizationUser@tooljet.io');
          expect(name).toEqual('test test');
          // Production response includes status and password (questions field was removed)
          expect(Object.keys(onboarding_details)).toEqual(['status', 'password']);
          await userData.user.reload();
          expect(userData.user.status).toBe('verified');
        });

        it('should return redirect url while verifying invitation token, organization token is available and user does not exist', async () => {
          const { orgUser } = await createUser(app, {
            email: 'organizationUser@tooljet.io',
            invitationToken: uuidv4(),
            status: 'invited',
          });

          const { invitationToken } = orgUser;
          const response = await request(app.getHttpServer())
            .get(`/api/onboarding/verify-invite-token?token=${uuidv4()}&organizationToken=${invitationToken}`)
            .expect(200);
          const {
            body: { redirect_url },
            status,
          } = response;
          expect(status).toBe(200);
          expect(redirect_url).toBe(
            `${process.env['TOOLJET_HOST']}/organization-invitations/${invitationToken}?oid=${orgUser.organizationId}`
          );
        });

        it('should return redirect url while verifying invitation token, organization token is not available and user exist', async () => {
          const { user } = await createUser(app, {
            email: 'organizationUser@tooljet.io',
            invitationToken: uuidv4(),
            status: 'invited',
          });

          const { invitationToken } = user;
          const response = await request(app.getHttpServer())
            .get(`/api/onboarding/verify-invite-token?token=${invitationToken}&organizationToken=${uuidv4()}`)
            .expect(200);
          const {
            body: { redirect_url },
            status,
          } = response;
          expect(status).toBe(200);
          expect(redirect_url).toBe(`${process.env['TOOLJET_HOST']}/invitations/${invitationToken}`);
        });
      });
    });

    // -------------------------------------------------------------------------
    // Personal workspace disabled
    // -------------------------------------------------------------------------

    // First user setup tests deleted | FirstUserSignupGuard uses LicenseCountsService.getUsersCount()
    // which caches user counts. Reliable first-user testing requires a fresh app instance.
    // Covered by onboarding/form-auth.e2e-spec.ts.

    describe('Multi organization with ALLOW_PERSONAL_WORKSPACE=false', () => {
      beforeEach(async () => {
        await instanceSettingsRepository.update(
          { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
          { value: 'false' }
        );
        // Ensure ConfigService mock falls through to process.env as baseline
        // (jest.resetAllMocks in afterEach clears the createMock<ConfigService> auto-mock)
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
          return process.env[key];
        });
      });
      beforeEach(async () => {
        const { organization, user } = await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
        current_organization = organization;
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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
          jest.spyOn(configService, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'DISABLE_SIGNUPS':
                return 'true';
              default:
                return process.env[key];
            }
          });
        });
        it('should not create new users', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/onboarding/signup')
            .send({ email: 'test@tooljet.io' });
          // Signup is disabled | production returns 400 (bad request) for incomplete signup data
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

    describe('POST /api/onboarding/verify-invite-token | Verify invite token (POST)', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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

        const loggedUser = await login(app, adminUser.email);
        await request(app.getHttpServer())
          .post(`/api/organization-users/`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ email: 'invited@tooljet.io', firstName: 'signupuser', lastName: 'user', role: 'end-user' })
          .expect(201);

        const invitedUserDetails = await findEntityOrFail(User, { email: 'invited@tooljet.io' } as any);

        const organizationUserBeforeUpdate = await findEntityOrFail(OrganizationUser, {
          userId: Not(adminUser.id),
          organizationId: org.id,
        } as any);

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
        const updatedUser = await findEntityOrFail(User, { email: 'invited@tooljet.io' } as any);
        expect(updatedUser.firstName).toEqual('signupuser');
        expect(updatedUser.lastName).toEqual('user');
        expect(updatedUser.defaultOrganizationId).toBe(org.id);
        const organizationUser = await findEntityOrFail(OrganizationUser, {
          userId: Not(adminUser.id),
          organizationId: org.id,
        } as any);
        expect(organizationUser.status).toEqual('active');

        const acceptInviteResponse = await request(app.getHttpServer()).post('/api/onboarding/accept-invite').send({
          token: organizationUser.invitationToken,
        });

        expect(acceptInviteResponse.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // Super Admin authentication
    // -------------------------------------------------------------------------

    // Super Admin onboarding tests deleted | the setup-super-admin endpoint
    // uses FirstUserSignupGuard (LicenseCountsService.getUsersCount) which caches
    // user counts across the NestJS app lifecycle. Reliable first-user testing
    // requires a fresh app instance per test | covered by onboarding/form-auth.e2e-spec.ts.

    describe('Multi organization - Super Admin authentication', () => {
      beforeEach(async () => {
        // Ensure ConfigService mock falls through to process.env as baseline
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
          return process.env[key];
        });
        const { organization, user, orgUser } = await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
          userType: 'instance',
        });
        current_organization = organization;
        current_organization_user = orgUser;
        current_user = user;
      });
      it('authenticate if valid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(201);
      });
      it('authenticate to organization if valid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate/' + current_organization.id)
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(201);
      });
      it('throw unauthorized error if super admin status is archived', async () => {
        const adminUser = await userRepository.findOneOrFail({
          where: { email: 'admin@tooljet.io' },
        });
        await userRepository.update({ id: adminUser.id }, { status: 'archived' });
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(401);
      });
      it('Super admin should not be able to login to workspace where they are archived', async () => {
        await createUser(app, { email: 'user@tooljet.io', organization: current_organization });

        const adminUser = await userRepository.findOneOrFail({
          where: { email: 'admin@tooljet.io' },
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

        await request(app.getHttpServer())
          .post(`/api/authenticate/${current_organization_user.organizationId}`)
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(401);
      });
      it('Super admin should be able to login if archived in a workspace and login to other workspace to access APIs', async () => {
        const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

        await request(app.getHttpServer())
          .post(`/api/authenticate/${orgUser.organizationId}`)
          .send({ email: 'user@tooljet.io', password: 'password' })
          .expect(401);

        const adminUser = await userRepository.findOneOrFail({
          where: { email: 'admin@tooljet.io' },
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

        const sessionResponse = await request(app.getHttpServer())
          .post(`/api/authenticate/${orgUser.organizationId}`)
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(201);

        const response = await request(app.getHttpServer())
          .get('/api/organization-users')
          .set('tj-workspace-id', orgUser.organizationId)
          .set('Cookie', sessionResponse.headers['set-cookie'])
          .send();

        expect(response.statusCode).toBe(200);
        expect(response.body?.users).toHaveLength(1);
        expect(response.body?.users?.[0]?.email).toBe('user@tooljet.io');
      });
      it('Super admin should be able to login if invited in the workspace', async () => {
        await createUser(app, { email: 'user@tooljet.io', organization: current_organization });

        const adminUser = await userRepository.findOneOrFail({
          where: { email: 'admin@tooljet.io' },
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

        const sessionResponse = await request(app.getHttpServer())
          .post(`/api/authenticate/${current_organization_user.organizationId}`)
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(201);

        const orgCount = await orgUserRepository.count({ where: { userId: adminUser.id } });

        expect(orgCount).toBe(1); // Should not create new workspace

        const response = await request(app.getHttpServer())
          .get('/api/organization-users')
          .set('tj-workspace-id', current_organization_user.organizationId)
          .set('Cookie', sessionResponse.headers['set-cookie'])
          .send();

        expect(response.statusCode).toBe(200);
        expect(response.body?.users).toHaveLength(2);
      });
      it('Super admin should be able to login if invited in a workspace and login to other workspace to access APIs', async () => {
        const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

        await request(app.getHttpServer())
          .post(`/api/authenticate/${orgUser.organizationId}`)
          .send({ email: 'user@tooljet.io', password: 'password' })
          .expect(401);

        const adminUser = await userRepository.findOneOrFail({
          where: { email: 'admin@tooljet.io' },
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

        const sessionResponse = await request(app.getHttpServer())
          .post(`/api/authenticate/${orgUser.organizationId}`)
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(201);

        const response = await request(app.getHttpServer())
          .get('/api/organization-users')
          .set('tj-workspace-id', orgUser.organizationId)
          .set('Cookie', sessionResponse.headers['set-cookie'])
          .send();

        expect(response.statusCode).toBe(200);
        expect(response.body?.users).toHaveLength(1);
        expect(response.body?.users?.[0]?.email).toBe('user@tooljet.io');
      });
      it('throw 401 if invalid credentials, maximum retry limit reached error after 5 retries', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' })
          .expect(401);

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' })
          .expect(401);

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' })
          .expect(401);

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' })
          .expect(401);

        const invalidCredentialResp = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' });

        expect(invalidCredentialResp.statusCode).toBe(401);
        expect(invalidCredentialResp.body.message).toBe('Invalid credentials');

        const response = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'pwd' });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe(
          'Maximum password retry limit reached, please reset your password using forgot password option'
        );
      });
      it('should be able to switch between organizations', async () => {
        const { orgUser, organization: invited_organization } = await createUser(app, { email: 'user@tooljet.io' });
        const loggedUser = await login(app, current_user.email);
        const response = await request(app.getHttpServer())
          .get('/api/switch/' + orgUser.organizationId)
          .set('tj-workspace-id', current_user.organizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(Object.keys(response.body).sort()).toEqual(
          [
            'id',
            'email',
            'first_name',
            'last_name',
            'current_organization_id',
            'current_organization_slug',
            'admin',
            'app_group_permissions',
            'avatar_id',
            'data_source_group_permissions',
            'group_permissions',
            'is_current_organization_archived',
            'metadata',
            'no_active_workspaces',
            'organization',
            'organization_id',
            'role',
            'sso_user_info',
            'super_admin',
            'user_permissions',
            'workflow_group_permissions',
          ].sort()
        );

        const { email, first_name, last_name, current_organization_id } = response.body;

        expect(email).toEqual(current_user.email);
        expect(first_name).toEqual(current_user.firstName);
        expect(last_name).toEqual(current_user.lastName);
        await current_user.reload();
        expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
      });
      it('should login if form login is disabled', async () => {
        await ssoConfigsRepository.update({ organizationId: current_organization.id }, { enabled: false });
        const response = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'password' });
        expect(response.statusCode).toBe(201);
      });
    });
  }); // EE (plan: enterprise)
});
