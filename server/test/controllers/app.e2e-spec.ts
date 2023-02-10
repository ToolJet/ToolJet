/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getManager, Repository, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, authHeaderForUser, createNestAppInstanceWithEnvMock } from '../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { EmailService } from '@services/email.service';
import { v4 as uuidv4 } from 'uuid';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let mockConfig;
  let current_organization: Organization;
  let current_user: User;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());

    userRepository = app.get('UserRepository');
    orgRepository = app.get('OrganizationRepository');
    orgUserRepository = app.get('OrganizationUserRepository');
    ssoConfigsRepository = app.get('SSOConfigsRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Single organization', () => {
    beforeEach(async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_SIGNUPS':
            return 'false';
          case 'DISABLE_MULTI_WORKSPACE':
            return 'true';
          default:
            return process.env[key];
        }
      });
    });
    it('should create new users and organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/setup-admin')
        .send({ email: 'test@tooljet.io', name: 'test', password: 'password', workspace: 'tooljet' });

      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(organization.name).toBe('tooljet');

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
    describe('Single organization operations', () => {
      beforeEach(async () => {
        current_organization = (await createUser(app, { email: 'admin@tooljet.io' })).organization;
      });
      it('should not create new users since organization already exist', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/signup')
          .send({ email: 'test@tooljet.io', name: 'test', password: 'password' });
        expect(response.statusCode).toBe(406);
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
      it('throw unauthorized error if user does not exist in given organization if valid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate/82249621-efc1-4cd2-9986-5c22182fa8a7')
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(401);
      });
      it('throw 401 if user is archived', async () => {
        await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'user@tooljet.io', password: 'password' })
          .expect(401);

        const adminUser = await userRepository.findOneOrFail({
          email: 'admin@tooljet.io',
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

        await request(app.getHttpServer())
          .get('/api/organizations/users')
          .set('Authorization', authHeaderForUser(adminUser))
          .expect(401);
      });
      it('throw 401 if user is invited', async () => {
        await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'user@tooljet.io', password: 'password' })
          .expect(401);

        const adminUser = await userRepository.findOneOrFail({
          email: 'admin@tooljet.io',
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

        await request(app.getHttpServer())
          .get('/api/organizations/users')
          .set('Authorization', authHeaderForUser(adminUser))
          .expect(401);
      });
      it('throw 400 if invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'amdin@tooljet.i0', password: 'password' })
          .expect(400);
      });
      it('should throw 401 if form login is disabled', async () => {
        await ssoConfigsRepository.update({ organizationId: current_organization.id }, { enabled: false });
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'admin@tooljet.io', password: 'password' })
          .expect(401);
      });
    });
  });

  describe('Multi organization', () => {
    beforeEach(async () => {
      const { organization, user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      current_organization = organization;
      current_user = user;
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
      it('should create new users', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/signup')
          .send({ email: 'test@tooljet.io', name: 'test', password: 'password' });
        expect(response.statusCode).toBe(201);

        const user = await userRepository.findOneOrFail({
          where: { email: 'test@tooljet.io' },
          relations: ['organizationUsers'],
        });

        const organization = await orgRepository.findOneOrFail({
          where: { id: user?.organizationUsers?.[0]?.organizationId },
        });

        expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
        expect(organization?.name).toBe('Untitled workspace');

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
          email: 'admin@tooljet.io',
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

        await request(app.getHttpServer())
          .get('/api/organizations/users')
          .set('Authorization', authHeaderForUser(adminUser))
          .expect(401);
      });
      it('throw 401 if user is invited', async () => {
        const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

        const response = await request(app.getHttpServer())
          .post(`/api/authenticate/${orgUser.organizationId}`)
          .send({ email: 'user@tooljet.io', password: 'password' })
          .expect(401);

        const adminUser = await userRepository.findOneOrFail({
          email: 'admin@tooljet.io',
        });
        await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

        await request(app.getHttpServer())
          .get('/api/organizations/users')
          .set('Authorization', authHeaderForUser(adminUser))
          .expect(401);
      });
      it('login to new organization if user is archived', async () => {
        const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

        const response = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'user@tooljet.io', password: 'password' });

        expect(response.statusCode).toBe(201);
        expect(response.body.organization_id).not.toBe(orgUser.organizationId);
        expect(response.body.organization).toBe('Untitled workspace');
      });
      it('login to new organization if user is invited', async () => {
        const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'invited' });

        const response = await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'user@tooljet.io', password: 'password' });

        expect(response.statusCode).toBe(201);
        expect(response.body.organization_id).not.toBe(orgUser.organizationId);
        expect(response.body.organization).toBe('Untitled workspace');
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
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
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
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
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
        expect(response.body.organization_id).not.toBe(current_organization.id);
        expect(response.body.organization).toBe('Untitled workspace');
      });
      it('should be able to switch between organizations with admin privilege', async () => {
        const { organization: invited_organization } = await createUser(
          app,
          { organizationName: 'New Organization' },
          current_user
        );
        const response = await request(app.getHttpServer())
          .get('/api/switch/' + invited_organization.id)
          .set('Authorization', authHeaderForUser(current_user));

        expect(response.statusCode).toBe(200);
        expect(Object.keys(response.body).sort()).toEqual(
          [
            'id',
            'email',
            'first_name',
            'last_name',
            'auth_token',
            'admin',
            'organization_id',
            'organization',
            'group_permissions',
            'app_group_permissions',
          ].sort()
        );

        const {
          email,
          first_name,
          last_name,
          admin,
          group_permissions,
          app_group_permissions,
          organization_id,
          organization,
        } = response.body;

        expect(email).toEqual(current_user.email);
        expect(first_name).toEqual(current_user.firstName);
        expect(last_name).toEqual(current_user.lastName);
        expect(admin).toBeTruthy();
        expect(organization_id).toBe(invited_organization.id);
        expect(organization).toBe(invited_organization.name);
        expect(group_permissions).toHaveLength(2);
        expect(group_permissions.some((gp) => gp.group === 'all_users')).toBeTruthy();
        expect(group_permissions.some((gp) => gp.group === 'admin')).toBeTruthy();
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
            'org_environment_variable_create',
            'org_environment_variable_update',
            'org_environment_variable_delete',
            'folder_delete',
            'folder_update',
          ].sort()
        );
        expect(app_group_permissions).toHaveLength(0);
        await current_user.reload();
        expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
      });
      it('should be able to switch between organizations with user privilege', async () => {
        const { organization: invited_organization } = await createUser(
          app,
          { groups: ['all_users'], organizationName: 'New Organization' },
          current_user
        );
        const response = await request(app.getHttpServer())
          .get('/api/switch/' + invited_organization.id)
          .set('Authorization', authHeaderForUser(current_user));

        expect(response.statusCode).toBe(200);
        expect(Object.keys(response.body).sort()).toEqual(
          [
            'id',
            'email',
            'first_name',
            'last_name',
            'auth_token',
            'admin',
            'organization_id',
            'organization',
            'group_permissions',
            'app_group_permissions',
          ].sort()
        );

        const {
          email,
          first_name,
          last_name,
          admin,
          group_permissions,
          app_group_permissions,
          organization_id,
          organization,
        } = response.body;

        expect(email).toEqual(current_user.email);
        expect(first_name).toEqual(current_user.firstName);
        expect(last_name).toEqual(current_user.lastName);
        expect(admin).toBeFalsy();
        expect(organization_id).toBe(invited_organization.id);
        expect(organization).toBe(invited_organization.name);
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
            'org_environment_variable_create',
            'org_environment_variable_update',
            'org_environment_variable_delete',
            'folder_delete',
            'folder_update',
          ].sort()
        );
        expect(app_group_permissions).toHaveLength(0);
        await current_user.reload();
        expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
      });
    });
  });

  describe('POST /api/forgot-password', () => {
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

      const user = await getManager().findOne(User, {
        where: { email: 'admin@tooljet.io' },
      });

      expect(emailServiceMock).toHaveBeenCalledWith(user.email, user.forgotPasswordToken);
    });
  });

  describe('POST /api/reset-password', () => {
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
        'Password should contain more than 5 letters',
        'password should not be empty',
        'password must be a string',
        'token should not be empty',
        'token must be a string',
      ]);
    });

    it('should reset password', async () => {
      const user = await getManager().findOne(User, {
        where: { email: 'admin@tooljet.io' },
      });

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

  describe('POST /api/accept-invite', () => {
    describe('Multi-Workspace Enabled', () => {
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

      it('should allow users to accept invitation when Multi-Workspace is enabled', async () => {
        const userData = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          status: 'invited',
        });

        const { user, orgUser } = userData;

        const response = await request(app.getHttpServer()).post('/api/accept-invite').send({
          token: orgUser.invitationToken,
        });

        expect(response.statusCode).toBe(201);

        const organizationUser = await getManager().findOneOrFail(OrganizationUser, { where: { userId: user.id } });
        expect(organizationUser.status).toEqual('active');
      });

      it('should not allow users to accept invitation when user sign up is not completed', async () => {
        const userData = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          invitationToken: uuidv4(),
          status: 'invited',
        });
        const { user, orgUser } = userData;

        const response = await request(app.getHttpServer()).post('/api/accept-invite').send({
          token: orgUser.invitationToken,
        });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe(
          'Please setup your account using account setup link shared via email before accepting the invite'
        );
      });
    });

    describe('Multi-Workspace Disabled', () => {
      beforeEach(() => {
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          switch (key) {
            case 'DISABLE_MULTI_WORKSPACE':
              return 'true';
            default:
              return process.env[key];
          }
        });
      });

      it('should allow users to accept invitation when Multi-Workspace is disabled', async () => {
        const userData = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          status: 'invited',
        });
        const { user, orgUser } = userData;

        const response = await request(app.getHttpServer()).post('/api/accept-invite').send({
          token: orgUser.invitationToken,
          password: uuidv4(),
        });

        expect(response.statusCode).toBe(201);

        const organizationUser = await getManager().findOneOrFail(OrganizationUser, { where: { userId: user.id } });
        expect(organizationUser.status).toEqual('active');
      });

      it('should not allow users to accept invitation when user not entered password for single workspace', async () => {
        const userData = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          invitationToken: uuidv4(),
          status: 'invited',
        });
        const { orgUser } = userData;

        const response = await request(app.getHttpServer()).post('/api/accept-invite').send({
          token: orgUser.invitationToken,
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Please enter password');
      });
    });
  });

  describe('GET /api/verify-invite-token', () => {
    describe('Multi-Workspace Enabled', () => {
      beforeEach(async () => {
        const { organization, user, orgUser } = await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
        current_organization = organization;
        current_user = user;
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          switch (key) {
            case 'DISABLE_MULTI_WORKSPACE':
              return 'false';
            default:
              return process.env[key];
          }
        });
      });
      it('should return 400 while verifying invalid invitation token', async () => {
        await request(app.getHttpServer()).get(`/api/verify-invite-token?token=${uuidv4()}`).expect(400);
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
        const response = await request(app.getHttpServer()).get(`/api/verify-invite-token?token=${invitationToken}`);
        const {
          body: { email, name, onboarding_details },
          status,
        } = response;
        expect(status).toBe(200);
        expect(email).toEqual('organizationUser@tooljet.io');
        expect(name).toEqual('test test');
        expect(Object.keys(onboarding_details)).toEqual(['password', 'questions']);
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
          .get(`/api/verify-invite-token?token=${uuidv4()}&organizationToken=${invitationToken}`)
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
          .get(`/api/verify-invite-token?token=${invitationToken}&organizationToken=${uuidv4()}`)
          .expect(200);
        const {
          body: { redirect_url },
          status,
        } = response;
        expect(status).toBe(200);
        expect(redirect_url).toBe(`${process.env['TOOLJET_HOST']}/invitations/${invitationToken}`);
      });
    });

    describe('Multi-Workspace Disabled', () => {
      beforeEach(async () => {
        const { organization, user } = await createUser(app, {
          email: 'admin@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
        current_organization = organization;
        current_user = user;
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          switch (key) {
            case 'DISABLE_MULTI_WORKSPACE':
              return 'true';
            default:
              return process.env[key];
          }
        });
      });
      it('should return 400 while verifying invalid organization token', async () => {
        await request(app.getHttpServer()).get(`/api/verify-organization-token?token=${uuidv4()}`).expect(400);
      });

      it('should return 400 if the user is archived', async () => {
        const {
          orgUser: { invitationToken },
        } = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          invitationToken: uuidv4(),
          status: 'archived',
        });

        await request(app.getHttpServer()).get(`/api/verify-organization-token?token=${invitationToken}`).expect(400);
      });

      it('should return user info while verifying organization token', async () => {
        const userData = await createUser(app, {
          email: 'organizationUser@tooljet.io',
          invitationToken: uuidv4(),
          status: 'invited',
        });
        const {
          orgUser: { invitationToken },
          user,
        } = userData;
        const response = await request(app.getHttpServer()).get(
          `/api/verify-organization-token?token=${invitationToken}`
        );
        const {
          body: { email, name, onboarding_details },
          status,
        } = response;
        expect(status).toBe(200);
        expect(email).toEqual('organizationUser@tooljet.io');
        expect(name).toEqual('test test');
        expect(Object.keys(onboarding_details)).toEqual(['password']);
        await user.reload();
        expect(user.status).toBe('verified');
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
