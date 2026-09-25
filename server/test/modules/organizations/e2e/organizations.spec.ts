import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, login, getEntityRepository, closeTestApp } from 'test-helper';
import { Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

/**
 * @group platform
 */
describe('OrganizationsController', () => {
  describe('with the default plan', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let configService: ConfigService;

    beforeAll(async () => {
      ({ app } = await initTestApp());
      configService = app.get(ConfigService);
      userRepository = getEntityRepository(User);
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    describe('GET /api/organization-users | List organization users', () => {
      it('should allow only authenticated users to list org users', async () => {
        await request(app.getHttpServer()).get('/api/organization-users').expect(401);
      });

      describe('POST /api/organizations | Create organization', () => {
        it('should allow only authenticated users to create organization', async () => {
          await request(app.getHttpServer()).post('/api/organizations').send({ name: 'My workspace' }).expect(401);
        });
        it('should create new organization if Multi-Workspace supported', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const superAdminUserData = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
          });

          let loggedUser = await login(app);
          user['tokenCookie'] = loggedUser.tokenCookie;
          loggedUser = await login(app, superAdminUserData.user.email, 'password', organization.id);
          superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

          for (const [index, userData] of [user, superAdminUserData.user].entries()) {
            const response = await request(app.getHttpServer())
              .post('/api/organizations')
              .send({ name: `My workspace ${index}`, slug: `my-workspace-${index}` })
              .set('tj-workspace-id', organization.id)
              .set('Cookie', userData['tokenCookie']);

            expect(response.statusCode).toBe(201);
            expect(response.body.organization_id).not.toBe(organization.id);
            expect(response.body.organization).toBe(`My workspace ${index}`);
            expect(response.body.admin).toBeTruthy();

            const newUser = await userRepository.findOneOrFail({ where: { id: userData.id } });
            expect(newUser.defaultOrganizationId).toBe(response.body.organization_id);
          }

          const response = await request(app.getHttpServer())
            .post('/api/organizations')
            .send({ name: 'My workspace', slug: 'my-workspace' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', user['tokenCookie']);

          expect(response.statusCode).toBe(201);
          expect(response.body.current_organization_id).not.toBe(organization.id);

          const newUser = await userRepository.findOneOrFail({ where: { id: user.id } });
          expect(newUser.defaultOrganizationId).toBe(response.body.current_organization_id);
        });

        it('should throw error if name is empty', async () => {
          const { user } = await createUser(app, { email: 'admin@tooljet.io' });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .post('/api/organizations')
            .send({ name: '', slug: 'slug' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(400);
        });

        it('should throw error if name is longer than 50 characters', async () => {
          const { user } = await createUser(app, { email: 'admin@tooljet.io' });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .post('/api/organizations')
            .send({ name: '100000000000000000000000000000000000000000000000000000000000000909', slug: 'sdsdds23423' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(400);
        });

        it('should create new organization if Multi-Workspace supported and user logged in via SSO', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .post('/api/organizations')
            .send({ name: 'My workspace', slug: 'my-workspace' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(201);
          expect(response.body.current_organization_id).not.toBe(organization.id);
        });
      });

      describe('PATCH /api/organizations | Update organization', () => {
        it('should throw error if name is longer than 50 characters', async () => {
          const { user } = await createUser(app, { email: 'admin@tooljet.io' });
          const loggedUser = await login(app);

          const response = await request(app.getHttpServer())
            .post('/api/organizations')
            .send({ name: '1000000000000000000000000000000000000000000000000000000000000009', slug: 'slug' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(400);
        });

        it('should not change organization params if changes are not done by admin', async () => {
          const { organization } = await createUser(app, { email: 'admin@tooljet.io' });
          const developerUserData = await createUser(app, {
            email: 'developer@tooljet.io',
            groups: ['end-user'],
            organization,
          });
          const loggedUser = await login(app, 'developer@tooljet.io');
          const response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-general')
            .send({ domain: 'tooljet.io', enableSignUp: true })
            .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(403);
        });
      });
      describe('PATCH /api/login-configs/organization-sso | Update SSO config', () => {
        it('should not change organization configs if changes are not done by admin', async () => {
          const { user } = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['end-user'],
          });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(403);
        });
      });
      describe('GET /api/login-configs/organization | Get SSO config', () => {
        it('should not get organization configs if request not done by admin', async () => {
          const { user } = await createUser(app, {
            email: 'admin@tooljet.io',
            groups: ['end-user'],
          });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .get('/api/login-configs/organization')
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(403);
        });
      });

      describe('GET /api/login-configs/:id/public | Get public SSO config', () => {
        it('should get organization specific details for all users for multiple organization deployment', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const loggedUser = await login(app);
          const response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);

          const getResponse = await request(app.getHttpServer()).get(`/api/login-configs/${organization.id}/public`);

          expect(getResponse.statusCode).toBe(200);
          expect(getResponse.body.sso_configs).toBeDefined();
          expect(getResponse.body.sso_configs.name).toBe(`${user.email}'s workspace`);
          expect(getResponse.body.sso_configs.id).toBe(organization.id);
          expect(getResponse.body.sso_configs.form).toBeDefined();
          expect(getResponse.body.sso_configs.form.sso).toBe('form');
          expect(getResponse.body.sso_configs.form.enabled).toBe(true);
          // client_secret must never be returned on the public (unauthenticated) endpoint
          expect(getResponse.body.sso_configs.git?.configs?.client_secret).toBeUndefined();
          expect(getResponse.body.sso_configs.git?.configs?.client_id).toBeDefined();
        });

        it('should get organization specific details with instance level sso and override it with organization sso configs for all users for multiple organization deployment', async () => {
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
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });

          const loggedUser = await login(app);

          const response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'git', configs: { clientId: 'org-client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);

          const getResponse = await request(app.getHttpServer()).get(`/api/login-configs/${organization.id}/public`);

          expect(getResponse.statusCode).toBe(200);
          expect(getResponse.body.sso_configs).toBeDefined();
          expect(getResponse.body.sso_configs.name).toBe(`${user.email}'s workspace`);
          expect(getResponse.body.sso_configs.id).toBe(organization.id);
          expect(getResponse.body.sso_configs.form).toBeDefined();
          expect(getResponse.body.sso_configs.form.sso).toBe('form');
          expect(getResponse.body.sso_configs.form.enabled).toBe(true);
          // Git config should be present (org-level overrides instance)
          expect(getResponse.body.sso_configs.git).toBeDefined();
          expect(getResponse.body.sso_configs.git.sso).toBe('git');
          // client_secret must never be returned on the public (unauthenticated) endpoint
          expect(getResponse.body.sso_configs.git?.configs?.client_secret).toBeUndefined();
          expect(getResponse.body.sso_configs.git?.configs?.client_id).toBeDefined();
        });

        it('should get organization specific details with instance level sso for all users for multiple organization deployment', async () => {
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
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });

          await login(app);

          const getResponse = await request(app.getHttpServer()).get(`/api/login-configs/${organization.id}/public`);

          expect(getResponse.statusCode).toBe(200);
          expect(getResponse.body.sso_configs).toBeDefined();
          expect(getResponse.body.sso_configs.name).toBe(`${user.email}'s workspace`);
          expect(getResponse.body.sso_configs.id).toBe(organization.id);
          expect(getResponse.body.sso_configs.form).toBeDefined();
          expect(getResponse.body.sso_configs.form.sso).toBe('form');
          expect(getResponse.body.sso_configs.form.enabled).toBe(true);
        });

        it('should not expose client_secret in OIDC configs on the public endpoint', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const loggedUser = await login(app);

          const patchResponse = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({
              type: 'openid',
              configs: {
                clientId: 'oidc-client-id',
                clientSecret: 'oidc-super-secret',
                wellKnownUrl: 'https://idp.example.com/.well-known/openid-configuration',
                name: 'Test OIDC',
              },
              enabled: true,
            })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(patchResponse.statusCode).toBe(200);

          const getResponse = await request(app.getHttpServer()).get(`/api/login-configs/${organization.id}/public`);

          expect(getResponse.statusCode).toBe(200);
          const oidcConfigs = getResponse.body.sso_configs?.openid;
          // OIDC is returned as an array for workspace-scoped configs
          const oidcEntry = Array.isArray(oidcConfigs) ? oidcConfigs[0] : oidcConfigs;
          expect(oidcEntry).toBeDefined();
          // client_secret must never appear — neither snake_case nor camelCase
          expect(oidcEntry?.configs?.client_secret).toBeUndefined();
          expect(oidcEntry?.configs?.clientSecret).toBeUndefined();
          // Public fields should still be present
          expect(oidcEntry?.configs?.client_id ?? oidcEntry?.configs?.clientId).toBeDefined();
        });
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);
  });

  describe('on the team plan', () => {
    let app: INestApplication;
    let instanceSettingsRepository: Repository<InstanceSettings>;

    beforeAll(async () => {
      ({ app } = await initTestApp({ plan: 'team' }));
      instanceSettingsRepository = getEntityRepository(InstanceSettings);
    });

    beforeEach(async () => {
      await instanceSettingsRepository.update(
        { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
        { value: 'false' }
      );
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    describe('ALLOW_PERSONAL_WORKSPACE=false', () => {
      describe('POST /api/organizations | Create organization', () => {
        it('should create new organization for super admin', async () => {
          const superAdminUserData = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
          });
          const loggedUser = await login(app, superAdminUserData.user.email);
          await request(app.getHttpServer())
            .post('/api/organizations')
            .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie)
            .send({ name: 'My workspace', slug: 'my-workspace' })
            .expect(201);
        });
      });

      describe('PATCH /api/organizations | Update organization', () => {
        it('should allow admin to change organization name even when personal workspace is disabled', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const loggedUser = await login(app, user.email);
          const response = await request(app.getHttpServer())
            .patch('/api/organizations')
            .send({ name: 'new name' })
            .set('tj-workspace-id', organization.id)
            .set('Cookie', loggedUser.tokenCookie);
          expect(response.statusCode).toBe(200);
        });

        it('should change organization name if changes are done by super admin', async () => {
          await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const superAdminUserData = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
          });
          const loggedUser = await login(app, superAdminUserData.user.email);
          const response = await request(app.getHttpServer())
            .patch('/api/organizations')
            .send({ name: 'new name' })
            .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);
        });
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);
  });
});
