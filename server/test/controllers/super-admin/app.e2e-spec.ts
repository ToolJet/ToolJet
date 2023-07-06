/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AuditLog } from 'src/entities/audit_log.entity';
import {
  clearDB,
  createUser,
  authHeaderForUser,
  createNestAppInstanceWithEnvMock,
  authenticateUser,
} from '../../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let mockConfig;
  let current_organization: Organization;
  let current_organization_user: OrganizationUser;
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

  describe('Single organization - Super Admin', () => {
    beforeEach(async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_MULTI_WORKSPACE':
            return 'true';
          default:
            return process.env[key];
        }
      });
    });
    it('should create new users and organization - user type should not be instance', async () => {
      const adminResponse = await request(app.getHttpServer())
        .post('/api/setup-admin')
        .send({ email: 'test@tooljet.io', name: 'Admin', password: 'password', workspace: 'test' });
      expect(adminResponse.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(user.userType).toBe('workspace');
      expect(organization.name).toBe('test');

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

  describe('Multi organization - Super Admin onboarding', () => {
    it('should create new users and organization - user type should instance', async () => {
      const adminResponse = await request(app.getHttpServer())
        .post('/api/setup-admin')
        .send({ email: 'test@tooljet.io', name: 'Admin', password: 'password', workspace: 'test' });
      expect(adminResponse.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(user.userType).toBe('instance');
      expect(organization.name).toBe('test');

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

    it('second user should not be a super admin', async () => {
      const adminResponse = await request(app.getHttpServer())
        .post('/api/setup-admin')
        .send({ email: 'testsuperadmin@tooljet.io', name: 'Admin', password: 'password', workspace: 'test' });
      expect(adminResponse.statusCode).toBe(201);

      const response = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'test@tooljet.io', name: 'admin', password: 'password' });
      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      // should create audit log
      const auditLog = await AuditLog.findOne({
        userId: user.id,
      });

      expect(auditLog.organizationId).toEqual(organization.id);
      expect(auditLog.resourceId).toEqual(user.id);
      expect(auditLog.resourceType).toEqual('USER');
      expect(auditLog.resourceName).toEqual(user.email);
      expect(auditLog.actionType).toEqual('USER_SIGNUP');
      expect(auditLog.createdAt).toBeDefined();

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(user.userType).toBe('workspace');
      expect(organization.name).toContain('My workspace');

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

  describe('Multi organization - Super Admin authentication', () => {
    beforeEach(async () => {
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
        email: 'admin@tooljet.io',
      });
      await userRepository.update({ id: adminUser.id }, { status: 'archived' });
      await request(app.getHttpServer())
        .post('/api/authenticate')
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(401);
    });
    it('Super admin should be able to login if archived in the workspace', async () => {
      await createUser(app, { email: 'user@tooljet.io', organization: current_organization });

      const adminUser = await userRepository.findOneOrFail({
        email: 'admin@tooljet.io',
      });
      await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

      const sessionResponse = await request(app.getHttpServer())
        .post(`/api/authenticate/${current_organization_user.organizationId}`)
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(201);

      const orgCount = await orgUserRepository.count({ userId: adminUser.id });

      expect(orgCount).toBe(1); // Should not create new workspace

      const response = await request(app.getHttpServer())
        .get('/api/organizations/users')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', sessionResponse.headers['set-cookie'])
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body?.users).toHaveLength(2);
    });
    it('Super admin should be able to login if archived in a workspace and login to other workspace to access APIs', async () => {
      const { orgUser } = await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

      await request(app.getHttpServer())
        .post(`/api/authenticate/${orgUser.organizationId}`)
        .send({ email: 'user@tooljet.io', password: 'password' })
        .expect(401);

      const adminUser = await userRepository.findOneOrFail({
        email: 'admin@tooljet.io',
      });
      await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

      const sessionResponse = await request(app.getHttpServer())
        .post(`/api/authenticate/${orgUser.organizationId}`)
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/organizations/users')
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
        email: 'admin@tooljet.io',
      });
      await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

      const sessionResponse = await request(app.getHttpServer())
        .post(`/api/authenticate/${current_organization_user.organizationId}`)
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(201);

      const orgCount = await orgUserRepository.count({ userId: adminUser.id });

      expect(orgCount).toBe(1); // Should not create new workspace

      const response = await request(app.getHttpServer())
        .get('/api/organizations/users')
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
        email: 'admin@tooljet.io',
      });
      await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

      const sessionResponse = await request(app.getHttpServer())
        .post(`/api/authenticate/${orgUser.organizationId}`)
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/organizations/users')
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
      const loggedUser = await authenticateUser(app, current_user.email);
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
          'admin',
          'app_group_permissions',
          'avatar_id',
          'created_at',
          'data_source_group_permissions',
          'group_permissions',
          'organization',
          'organization_id',
          'super_admin',
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

  afterAll(async () => {
    await app.close();
  });
});
