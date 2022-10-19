import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock } from '../../test.helper';
import { OAuth2Client } from 'google-auth-library';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';

describe('oauth controller', () => {
  let app: INestApplication;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let orgRepository: Repository<Organization>;
  let mockConfig;

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
              email: 'ssoUser@tooljet.io',
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
              email: 'ssoUser@tooljett.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return login info when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('User');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });

        it('should return login info when the user does not exist and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('User');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return login info when the user does not exist and name not available and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, admin, group_permissions, app_group_permissions, organization_id, organization } =
            response.body;

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('ssoUser');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotherUser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotherUser1@tooljet.io',
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

          expect(email).toEqual('anotherUser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return login info when the user exist but invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotherUser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'invited',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotherUser1@tooljet.io',
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

          expect(email).toEqual('anotherUser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
          await orgUser.reload();
          expect(orgUser.status).toEqual('active');
        });
      });
    });

    describe('Multi-Workspace Disabled', () => {
      beforeEach(async () => {
        jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
          if (key === 'DISABLE_MULTI_WORKSPACE') {
            return 'true';
          } else {
            return process.env[key];
          }
        });
      });
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
              email: 'ssoUser@tooljet.io',
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
              email: 'ssoUser@tooljett.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return login info when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('User');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });

        it('should return login info when the user does not exist and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('User');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return login info when the user does not exist and name not available and sign up is enabled', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssoUser@tooljet.io',
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

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, admin, group_permissions, app_group_permissions, organization_id, organization } =
            response.body;

          expect(email).toEqual('ssoUser@tooljet.io');
          expect(first_name).toEqual('ssoUser');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return 401 when the user exist but archived and sign up is enabled', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotherUser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'archived',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotherUser1@tooljet.io',
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

          expect(response.statusCode).toBe(401);
        });
        it('should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotherUser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotherUser1@tooljet.io',
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

          expect(email).toEqual('anotherUser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
        });
        it('should return login info when the user exist with invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotherUser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'invited',
          });
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'anotherUser1@tooljet.io',
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

          expect(email).toEqual('anotherUser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(admin).toBeFalsy();
          expect(organization_id).toBe(current_organization.id);
          expect(organization).toBe(current_organization.name);
          expect(group_permissions).toHaveLength(1);
          expect(group_permissions[0].group).toEqual('all_users');
          expect(Object.keys(group_permissions[0]).sort()).toEqual(groupPermissionsKeys);
          expect(app_group_permissions).toHaveLength(0);
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
