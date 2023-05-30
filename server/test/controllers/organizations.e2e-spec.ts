import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, authenticateUser } from '../test.helper';
import { Repository } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';

describe('organizations controller', () => {
  let app: INestApplication;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let userRepository: Repository<User>;
  let mockConfig;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    ssoConfigsRepository = app.get('SSOConfigsRepository');
    userRepository = app.get('UserRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('list organization users', () => {
    it('should allow only authenticated users to list org users', async () => {
      await request(app.getHttpServer()).get('/api/organizations/users').expect(401);
    });

    it('should list organization users', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user, orgUser } = userData;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/organizations/users?page=1')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie']);

      expect(response.statusCode).toBe(200);
      expect(response.body.users.length).toBe(1);

      await orgUser.reload();

      expect(response.body.users[0]).toStrictEqual({
        email: user.email,
        user_id: user.id,
        first_name: user.firstName,
        id: orgUser.id,
        last_name: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: orgUser.role,
        status: orgUser.status,
        avatar_id: user.avatarId,
      });
    });

    describe('create organization', () => {
      it('should allow only authenticated users to create organization', async () => {
        await request(app.getHttpServer()).post('/api/organizations').send({ name: 'My workspace' }).expect(401);
      });
      it('should create new organization if Multi-Workspace supported', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });

        const loggedUser = await authenticateUser(app);

        const response = await request(app.getHttpServer())
          .post('/api/organizations')
          .send({ name: 'My workspace' })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(201);
        expect(response.body.current_organization_id).not.toBe(organization.id);

        const newUser = await userRepository.findOneOrFail({ where: { id: user.id } });
        expect(newUser.defaultOrganizationId).toBe(response.body.current_organization_id);
      });

      it('should throw error if name is empty', async () => {
        const { user } = await createUser(app, { email: 'admin@tooljet.io' });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .post('/api/organizations')
          .send({ name: '' })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(400);
      });

      it('should throw error if name is longer than 50 characters', async () => {
        const { user } = await createUser(app, { email: 'admin@tooljet.io' });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .post('/api/organizations')
          .send({ name: '100000000000000000000000000000000000000000000000000000000000000909' })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(400);
      });

      it('should create new organization if Multi-Workspace supported and user logged in via SSO', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .post('/api/organizations')
          .send({ name: 'My workspace' })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(201);
        expect(response.body.current_organization_id).not.toBe(organization.id);
      });
    });
    describe('update organization', () => {
      it('should change organization params if changes are done by admin', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations')
          .send({ name: 'new name', domain: 'tooljet.io', enableSignUp: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        await organization.reload();
        expect(organization.name).toBe('new name');
        expect(organization.domain).toBe('tooljet.io');
        expect(organization.enableSignUp).toBeTruthy();
      });

      it('should throw error if name is longer than 50 characters', async () => {
        const { user } = await createUser(app, { email: 'admin@tooljet.io' });
        const loggedUser = await authenticateUser(app);

        const response = await request(app.getHttpServer())
          .post('/api/organizations')
          .send({ name: '1000000000000000000000000000000000000000000000000000000000000009' })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(400);
      });

      it('should not change organization params if changes are not done by admin', async () => {
        const { organization } = await createUser(app, { email: 'admin@tooljet.io' });
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users'],
          organization,
        });
        const loggedUser = await authenticateUser(app, 'developer@tooljet.io');
        const response = await request(app.getHttpServer())
          .patch('/api/organizations')
          .send({ name: 'new name', domain: 'tooljet.io', enableSignUp: true })
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(403);
      });
    });
    describe('update organization configs', () => {
      it('should change organization configs if changes are done by admin', async () => {
        const { user } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/configs')
          .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        const ssoConfigs = await ssoConfigsRepository.findOneOrFail({ where: { id: response.body.id } });
        expect(ssoConfigs.sso).toBe('git');
        expect(ssoConfigs.enabled).toBeTruthy();
        expect(ssoConfigs.configs.clientId).toBe('client-id');
        expect(ssoConfigs.configs['clientSecret']).not.toBe('client-secret');
      });

      it('should not change organization configs if changes are not done by admin', async () => {
        const { user } = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users'],
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/configs')
          .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(403);
      });
    });
    describe('get organization configs', () => {
      it('should get organization details if requested by admin', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/configs')
          .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);

        const getResponse = await request(app.getHttpServer())
          .get('/api/organizations/configs')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(getResponse.statusCode).toBe(200);

        expect(getResponse.body.organization_details.id).toBe(organization.id);
        expect(getResponse.body.organization_details.name).toBe(organization.name);
        expect(getResponse.body.organization_details.sso_configs.length).toBe(2);
        expect(getResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'form').organization_id).toBe(
          organization.id
        );
        expect(getResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'git').enabled).toBeTruthy();
        expect(getResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'git').configs).toEqual({
          client_id: 'client-id',
          client_secret: 'client-secret',
        });
      });

      it('should not get organization configs if request not done by admin', async () => {
        const { user } = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users'],
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .get('/api/organizations/configs')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(403);
      });
    });

    describe('get public organization configs', () => {
      it('should get organization specific details for all users for multiple organization deployment', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/configs')
          .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);

        const getResponse = await request(app.getHttpServer()).get(
          `/api/organizations/${organization.id}/public-configs`
        );

        expect(getResponse.statusCode).toBe(200);

        const authGetResponse = await request(app.getHttpServer())
          .get('/api/organizations/configs')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(authGetResponse.statusCode).toBe(200);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body).toEqual({
          sso_configs: {
            name: `${user.email}'s workspace`,
            enable_sign_up: false,
            form: {
              config_id: authGetResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'form').id,
              sso: 'form',
              configs: {},
              enabled: true,
            },
            git: {
              config_id: authGetResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'git').id,
              sso: 'git',
              configs: { client_id: 'client-id', client_secret: '' },
              enabled: true,
            },
          },
        });
      });

      it('should get organization specific details with instance level sso and override it with organization sso configs for all users for multiple organization deployment', async () => {
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
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });

        const loggedUser = await authenticateUser(app);

        const response = await request(app.getHttpServer())
          .patch('/api/organizations/configs')
          .send({ type: 'git', configs: { clientId: 'org-client-id', clientSecret: 'client-secret' }, enabled: true })
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);

        const getResponse = await request(app.getHttpServer()).get(
          `/api/organizations/${organization.id}/public-configs`
        );

        expect(getResponse.statusCode).toBe(200);

        const authGetResponse = await request(app.getHttpServer())
          .get('/api/organizations/configs')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(authGetResponse.statusCode).toBe(200);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body).toEqual({
          sso_configs: {
            name: `${user.email}'s workspace`,
            enable_sign_up: false,
            form: {
              config_id: authGetResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'form').id,
              sso: 'form',
              configs: {},
              enabled: true,
            },
            git: {
              config_id: authGetResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'git').id,
              sso: 'git',
              configs: { client_id: 'org-client-id', client_secret: '' },
              enabled: true,
            },
            google: {
              sso: 'google',
              configs: { client_id: 'google-client-id', client_secret: '' },
              enabled: true,
            },
          },
        });
      });

      it('should get organization specific details with instance level sso for all users for multiple organization deployment', async () => {
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
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });

        const loggedUser = await authenticateUser(app);

        const getResponse = await request(app.getHttpServer()).get(
          `/api/organizations/${organization.id}/public-configs`
        );

        expect(getResponse.statusCode).toBe(200);

        const authGetResponse = await request(app.getHttpServer())
          .get('/api/organizations/configs')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(authGetResponse.statusCode).toBe(200);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body).toEqual({
          sso_configs: {
            name: `${user.email}'s workspace`,
            enable_sign_up: false,
            form: {
              config_id: authGetResponse.body.organization_details.sso_configs.find((ob) => ob.sso === 'form').id,
              sso: 'form',
              configs: {},
              enabled: true,
            },
            git: {
              sso: 'git',
              configs: {
                client_id: 'git-client-id',
                client_secret: '',
              },
              enabled: true,
            },
            google: {
              sso: 'google',
              configs: { client_id: 'google-client-id', client_secret: '' },
              enabled: true,
            },
          },
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
