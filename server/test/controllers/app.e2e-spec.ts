/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getManager, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, authHeaderForUser, createNestAppInstanceWithEnvMock } from '../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { EmailService } from '@services/email.service';

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
    it('should create new users and organization', async () => {
      const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'test@tooljet.io' },
        relations: ['organizationUsers'],
      });

      const organization = await orgRepository.findOneOrFail({
        where: { id: user?.organizationUsers?.[0]?.organizationId },
      });

      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
      expect(organization.name).toBe('Untitled organization');

      const groupPermissions = await user.groupPermissions;
      const groupNames = groupPermissions.map((x) => x.group);

      expect(new Set(['all_users', 'admin'])).toEqual(new Set(groupNames));

      const adminGroup = groupPermissions.find((x) => x.group == 'admin');
      expect(adminGroup.appCreate).toBeTruthy();
      expect(adminGroup.appDelete).toBeTruthy();
      expect(adminGroup.folderCreate).toBeTruthy();

      const allUserGroup = groupPermissions.find((x) => x.group == 'all_users');
      expect(allUserGroup.appCreate).toBeFalsy();
      expect(allUserGroup.appDelete).toBeFalsy();
      expect(allUserGroup.folderCreate).toBeFalsy();
    });
    describe('Single organization operations', () => {
      beforeEach(async () => {
        current_organization = (await createUser(app, { email: 'admin@tooljet.io' })).organization;
      });
      it('should not create new users since organization already exist', async () => {
        const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
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
      it('throw unauthorized error if user not exist in given organization if valid credentials', async () => {
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
      it('throw 401 if invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'amdin@tooljet.io', password: 'pwd' })
          .expect(401);
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
          case 'MULTI_ORGANIZATION':
            return 'true';
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
            case 'MULTI_ORGANIZATION':
              return 'true';
            default:
              return process.env[key];
          }
        });
      });
      it('should not create new users', async () => {
        const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
        expect(response.statusCode).toBe(406);
      });
    });
    describe('sign up enabled and authorization', () => {
      it('should create new users', async () => {
        const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
        expect(response.statusCode).toBe(201);

        const user = await userRepository.findOneOrFail({
          where: { email: 'test@tooljet.io' },
          relations: ['organizationUsers'],
        });

        const organization = await orgRepository.findOneOrFail({
          where: { id: user?.organizationUsers?.[0]?.organizationId },
        });

        expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
        expect(organization?.name).toBe('Untitled organization');

        const groupPermissions = await user.groupPermissions;
        const groupNames = groupPermissions.map((x) => x.group);

        expect(new Set(['all_users', 'admin'])).toEqual(new Set(groupNames));

        const adminGroup = groupPermissions.find((x) => x.group == 'admin');
        expect(adminGroup.appCreate).toBeTruthy();
        expect(adminGroup.appDelete).toBeTruthy();
        expect(adminGroup.folderCreate).toBeTruthy();

        const allUserGroup = groupPermissions.find((x) => x.group == 'all_users');
        expect(allUserGroup.appCreate).toBeFalsy();
        expect(allUserGroup.appDelete).toBeFalsy();
        expect(allUserGroup.folderCreate).toBeFalsy();
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
      it('throw unauthorized error if user not exist in given organization if valid credentials', async () => {
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
      it('throw 401 if invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/authenticate')
          .send({ email: 'amdin@tooljet.io', password: 'pwd' })
          .expect(401);
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
        expect(response.body.organization).toBe('Untitled organization');
      });
      it('should be able to switch between organizations with admin privilage', async () => {
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
          ].sort()
        );
        expect(app_group_permissions).toHaveLength(0);
        await current_user.reload();
        expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
      });
      it('should be able to switch between organizations with user privilage', async () => {
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
          ].sort()
        );
        expect(app_group_permissions).toHaveLength(0);
        await current_user.reload();
        expect(current_user.defaultOrganizationId).toBe(invited_organization.id);
      });
    });
  });

  describe('POST /api/forgot_password', () => {
    beforeEach(async () => {
      await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
    });
    it('should return error if required params are not present', async () => {
      const response = await request(app.getHttpServer()).post('/api/forgot_password');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toStrictEqual(['email should not be empty', 'email must be an email']);
    });

    it('should set token and send email', async () => {
      const emailServiceMock = jest.spyOn(EmailService.prototype, 'sendPasswordResetEmail');
      emailServiceMock.mockImplementation();

      const response = await request(app.getHttpServer())
        .post('/api/forgot_password')
        .send({ email: 'admin@tooljet.io' });

      expect(response.statusCode).toBe(201);

      const user = await getManager().findOne(User, {
        where: { email: 'admin@tooljet.io' },
      });

      expect(emailServiceMock).toHaveBeenCalledWith(user.email, user.forgotPasswordToken);
    });
  });

  describe('POST /api/reset_password', () => {
    beforeEach(async () => {
      await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
    });
    it('should return error if required params are not present', async () => {
      const response = await request(app.getHttpServer()).post('/api/reset_password');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toStrictEqual([
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

      const response = await request(app.getHttpServer()).post('/api/reset_password').send({
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

  afterAll(async () => {
    await app.close();
  });
});
