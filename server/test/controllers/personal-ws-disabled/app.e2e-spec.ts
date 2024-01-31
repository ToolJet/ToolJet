/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getManager, Repository, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, authenticateUser } from '../../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { v4 as uuidv4 } from 'uuid';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

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
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());

    userRepository = app.get('UserRepository');
    orgRepository = app.get('OrganizationRepository');
    ssoConfigsRepository = app.get('SSOConfigsRepository');
    instanceSettingsRepository = app.get('InstanceSettingsRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Multi organization with ALLOW_PERSONAL_WORKSPACE=false : First user setup', () => {
    it('should not create user through sign up', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'test@tooljet.io', name: 'Admin', password: 'password' });
      expect(response.statusCode).toBe(403);
    });

    it('should create super admin for first sign up', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/setup-admin')
        .send({ email: 'test@tooljet.io', name: 'Admin', password: 'password', workspace: 'test' });
      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(user.userType).toBe('instance');
      expect(user.status).toBe('active');
      expect(organization?.name).toBe('test');

      const groupPermissions = await user.groupPermissions;
      const groupNames = groupPermissions.map((x) => x.group);

      expect(new Set(['all_users', 'admin'])).toEqual(new Set(groupNames));

      const adminGroup = groupPermissions.find((x) => x.group == 'admin');
      expect(adminGroup.appCreate).toBeTruthy();
      expect(adminGroup.appDelete).toBeTruthy();
      expect(adminGroup.folderCreate).toBeTruthy();
      expect(adminGroup.orgEnvironmentVariableCreate).toBeTruthy();
      expect(adminGroup.orgEnvironmentVariableUpdate).toBeTruthy();
      expect(adminGroup.orgEnvironmentVariableDelete).toBeTruthy();
      expect(adminGroup.folderUpdate).toBeTruthy();
      expect(adminGroup.folderDelete).toBeTruthy();

      const allUserGroup = groupPermissions.find((x) => x.group == 'all_users');
      expect(allUserGroup.appCreate).toBeFalsy();
      expect(allUserGroup.appDelete).toBeFalsy();
      expect(allUserGroup.folderCreate).toBeFalsy();
      expect(allUserGroup.orgEnvironmentVariableCreate).toBeFalsy();
      expect(allUserGroup.orgEnvironmentVariableUpdate).toBeFalsy();
      expect(allUserGroup.orgEnvironmentVariableDelete).toBeFalsy();
      expect(allUserGroup.folderUpdate).toBeFalsy();
      expect(allUserGroup.folderDelete).toBeFalsy();
    });
  });

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
        const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
        expect(response.statusCode).toBe(403);
      });
    });
    describe('sign up enabled and authorization', () => {
      it('should not allow signup', async () => {
        const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
        expect(response.statusCode).toBe(403);
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

  describe('POST /api/verify-invite-token', () => {
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
        .get('/api/verify-invite-token?token=' + invitationToken)
        .send();

      expect(verifyResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer()).post('/api/setup-account-from-token').send({
        first_name: 'signupuser',
        last_name: 'user',
        companyName: 'org1',
        password: uuidv4(),
        token: invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should allow users setup account and accept invite', async () => {
      const { organization: org, user: adminUser } = await createUser(app, {
        email: 'admin@tooljet.io',
      });

      const loggedUser = await authenticateUser(app, adminUser.email);
      await request(app.getHttpServer())
        .post(`/api/organization_users/`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ email: 'invited@tooljet.io', first_name: 'signupuser', last_name: 'user' })
        .expect(201);

      const invitedUserDetails = await getManager().findOneOrFail(User, { where: { email: 'invited@tooljet.io' } });

      const organizationUserBeforeUpdate = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: Not(adminUser.id), organizationId: org.id },
      });

      const verifyResponse = await request(app.getHttpServer())
        .get(
          '/api/verify-invite-token?token=' +
            invitedUserDetails.invitationToken +
            '&organizationToken=' +
            organizationUserBeforeUpdate.invitationToken
        )
        .send();

      expect(verifyResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer()).post('/api/setup-account-from-token').send({
        companyName: 'org1',
        password: uuidv4(),
        token: invitedUserDetails.invitationToken,
        organizationToken: organizationUserBeforeUpdate.invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(201);
      const updatedUser = await getManager().findOneOrFail(User, { where: { email: 'invited@tooljet.io' } });
      expect(updatedUser.firstName).toEqual('signupuser');
      expect(updatedUser.lastName).toEqual('user');
      expect(updatedUser.defaultOrganizationId).toBe(org.id);
      expect(invitedUserDetails.defaultOrganizationId).toBe(org.id);
      const organizationUser = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: Not(adminUser.id), organizationId: org.id },
      });
      expect(organizationUser.status).toEqual('active');

      const acceptInviteResponse = await request(app.getHttpServer()).post('/api/accept-invite').send({
        token: organizationUser.invitationToken,
      });

      expect(acceptInviteResponse.statusCode).toBe(400);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
