import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock } from '../../../test.helper';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

describe('oauth controller', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgUserRepository: Repository<OrganizationUser>;

  let mockConfig;
  const token = 'some-Token';
  let current_user: User;

  const authResponseKeys = [
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
    'super_admin',
  ].sort();

  const groupPermissionsKeys = [
    'id',
    'organization_id',
    'group',
    'app_create',
    'app_delete',
    'updated_at',
    'created_at',
    'folder_create',
    'folder_update',
    'folder_delete',
    'org_environment_variable_create',
    'org_environment_variable_delete',
    'org_environment_variable_update',
  ].sort();

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    userRepository = app.get('UserRepository');
    orgUserRepository = app.get('OrganizationUserRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('SSO Login', () => {
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

    describe('Multi-Workspace instance level SSO: Setup first user', () => {
      it('First user should be super admin', async () => {
        const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
        googleVerifyMock.mockImplementation(() => ({
          getPayload: () => ({
            sub: 'someSSOId',
            email: 'ssoUser@tooljet.io',
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

        const {
          email,
          first_name,
          last_name,
          admin,
          group_permissions,
          app_group_permissions,
          organization,
          super_admin,
        } = response.body;

        expect(email).toEqual('ssoUser@tooljet.io');
        expect(first_name).toEqual('SSO');
        expect(last_name).toEqual('User');
        expect(admin).toBeTruthy();
        expect(super_admin).toBeTruthy();
        expect(organization).toBe('Untitled workspace');
        expect(group_permissions).toHaveLength(2);
        expect([group_permissions[0].group, group_permissions[1].group]).toContain('all_users');
        expect([group_permissions[0].group, group_permissions[1].group]).toContain('admin');
        expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
        expect(Object.keys(group_permissions[1]).sort()).toEqual(groupPermissionsKeys);
        expect(app_group_permissions).toHaveLength(0);
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
            email: 'ssoUser@tooljet.io',
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

        const {
          email,
          first_name,
          last_name,
          admin,
          group_permissions,
          app_group_permissions,
          organization,
          super_admin,
        } = response.body;

        expect(email).toEqual('ssoUser@tooljet.io');
        expect(first_name).toEqual('SSO');
        expect(last_name).toEqual('User');
        expect(admin).toBeTruthy();
        expect(super_admin).toBeFalsy();
        expect(organization).toBe('Untitled workspace');
        expect(group_permissions).toHaveLength(2);
        expect([group_permissions[0].group, group_permissions[1].group]).toContain('all_users');
        expect([group_permissions[0].group, group_permissions[1].group]).toContain('admin');
        expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
        expect(Object.keys(group_permissions[1]).sort()).toEqual(groupPermissionsKeys);
        expect(app_group_permissions).toHaveLength(0);
      });
    });

    describe('Multi-Workspace instance level SSO', () => {
      beforeEach(async () => {
        const { user } = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        current_user = user;
      });
      describe('sign in via Google OAuth', () => {
        it('Workspace Login - should return 201 when the super admin log in', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const orgCount = await orgUserRepository.count({ userId: current_user.id });
          expect(orgCount).toBe(1); // Should not create new workspace
        });
        it('Workspace Login - should return 401 when the super admin status is archived', async () => {
          await userRepository.update({ email: 'superadmin@tooljet.io' }, { status: 'archived' });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
        });
        it('Workspace Login - should return 201 when the super admin status is invited in the organization', async () => {
          const adminUser = await userRepository.findOneOrFail({
            email: 'superadmin@tooljet.io',
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const orgCount = await orgUserRepository.count({ userId: current_user.id });
          expect(orgCount).toBe(1); // Should not create new workspace
        });
        it('Workspace Login - should return 201 when the super admin status is archived in the organization', async () => {
          const adminUser = await userRepository.findOneOrFail({
            email: 'superadmin@tooljet.io',
          });
          await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(201);

          expect(googleVerifyMock).toHaveBeenCalledWith({
            idToken: token,
            audience: 'google-client-id',
          });

          const orgCount = await orgUserRepository.count({ userId: current_user.id });
          expect(orgCount).toBe(1); // Should not create new workspace
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
