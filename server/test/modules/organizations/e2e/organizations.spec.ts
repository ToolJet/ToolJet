import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, login, getEntityRepository, closeTestApp } from 'test-helper';
import { Repository } from 'typeorm';
import { SSOConfigs } from '@entities/sso_config.entity';
import { User } from '@entities/user.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

/**
 * @group platform
 */
describe('OrganizationsController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let ssoConfigsRepository: Repository<SSOConfigs>;
    let userRepository: Repository<User>;
    let configService: ConfigService;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      configService = app.get(ConfigService);
      ssoConfigsRepository = getEntityRepository(SSOConfigs);
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

      it('should list organization users if the user is admin or super admin', async () => {
        const adminUserData = await createUser(app, { email: 'admin@tooljet.io' });
        const superAdminUserData = await createUser(app, { email: 'superadmin@tooljet.io', userType: 'instance' });

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        for (const userData of [adminUserData, superAdminUserData]) {
          const { user, orgUser } = adminUserData;
          const response = await request(app.getHttpServer())
            .get('/api/organization-users?page=1')
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie']);

          expect(response.statusCode).toBe(200);
          expect(response.body.users.length).toBe(1);

          await orgUser.reload();

          expect(response.body.users[0]).toMatchObject({
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
        }
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
        it('should change organization params if changes are done by admin / super admin', async () => {
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

          // Update name via organizations endpoint
          await request(app.getHttpServer())
            .patch('/api/organizations')
            .send({ name: 'new name' })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', user['tokenCookie']);

          // Update domain and enableSignUp via login-configs/organization-general endpoint
          await request(app.getHttpServer())
            .patch('/api/login-configs/organization-general')
            .send({ domain: 'tooljet.io', enableSignUp: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', user['tokenCookie']);

          for (const userData of [user, superAdminUserData.user]) {
            const nameResponse = await request(app.getHttpServer())
              .patch('/api/organizations')
              .send({ name: 'new name' })
              .set('tj-workspace-id', organization.id)
              .set('Cookie', userData['tokenCookie']);

            expect(nameResponse.statusCode).toBe(200);

            const generalResponse = await request(app.getHttpServer())
              .patch('/api/login-configs/organization-general')
              .send({ domain: 'tooljet.io', enableSignUp: true })
              .set('tj-workspace-id', organization.id)
              .set('Cookie', userData['tokenCookie']);

            expect(generalResponse.statusCode).toBe(200);

            await organization.reload();
            expect(organization.name).toBe('new name');
            expect(organization.domain).toBe('tooljet.io');
            expect(organization.enableSignUp).toBeTruthy();
          }
        });

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

        it('should change organization name if changes are done by admin / super admin', async () => {
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

          for (const userData of [user, superAdminUserData.user]) {
            const response = await request(app.getHttpServer())
              .patch('/api/organizations')
              .send({ name: 'new name' })
              .set('tj-workspace-id', organization.id)
              .set('Cookie', userData['tokenCookie']);

            expect(response.statusCode).toBe(200);
            await organization.reload();
            expect(organization.name).toBe('new name');
          }
        });
      });
      describe('PATCH /api/login-configs/organization-sso | Update SSO config', () => {
        it('should change organization configs if changes are done by admin / super admin', async () => {
          const { user, organization } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const superAdminUserData = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
          });

          const loggedUser = await login(app, superAdminUserData.user.email, 'password', organization.id);
          let response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);
          let ssoConfigs = await ssoConfigsRepository.findOneOrFail({ where: { id: response.body.id } });
          expect(ssoConfigs.sso).toBe('git');
          expect(ssoConfigs.enabled).toBeTruthy();
          const gitConfigs = ssoConfigs.configs as Record<string, any>;
          expect(gitConfigs['clientId']).toBe('client-id');
          expect(gitConfigs['clientSecret']).not.toBe('client-secret');

          const loggedSuperAdminUser = await login(app, superAdminUserData.user.email, 'password', organization.id);
          response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'google', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', organization.id)
            .set('Cookie', loggedSuperAdminUser.tokenCookie);

          expect(response.statusCode).toBe(200);
          ssoConfigs = await ssoConfigsRepository.findOneOrFail({ where: { id: response.body.id } });
          expect(ssoConfigs.sso).toBe('google');
          expect(ssoConfigs.enabled).toBeTruthy();
          const googleConfigs = ssoConfigs.configs as Record<string, any>;
          expect(googleConfigs['clientId']).toBe('client-id');
          expect(googleConfigs['clientSecret']).not.toBe('client-secret');
        });

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
        it('should get organization details if requested by admin/super admin', async () => {
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

          const response = await request(app.getHttpServer())
            .patch('/api/login-configs/organization-sso')
            .send({ type: 'git', configs: { clientId: 'client-id', clientSecret: 'client-secret' }, enabled: true })
            .set('tj-workspace-id', user.defaultOrganizationId)
            .set('Cookie', user['tokenCookie']);

          expect(response.statusCode).toBe(200);

          for (const userData of [user, superAdminUserData.user]) {
            const getResponse = await request(app.getHttpServer())
              .get('/api/login-configs/organization')
              .set('tj-workspace-id', organization.id)
              .set('Cookie', userData['tokenCookie']);

            expect(getResponse.statusCode).toBe(200);

            expect(getResponse.body.organization_details.id).toBe(organization.id);
            expect(getResponse.body.organization_details.name).toBe(organization.name);
            // Verify that both form and git SSO configs are present
            const ssoConfigs = getResponse.body.organization_details.sso_configs;
            expect(ssoConfigs.length).toBeGreaterThanOrEqual(2);
            expect(ssoConfigs.find((ob) => ob.sso === 'form').organization_id).toBe(organization.id);
            const gitConfig = ssoConfigs.find((ob) => ob.sso === 'git');
            expect(gitConfig).toBeTruthy();
            expect(gitConfig.sso).toBe('git');
          }
        });

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
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);
  });

  describe('EE (plan: team)', () => {
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
        it('should not allow authenticated users to create organization', async () => {
          const { user: userData } = await createUser(app, {
            email: 'admin@tooljet.io',
          });
          const loggedUser = await login(app, userData.email);
          await request(app.getHttpServer())
            .post('/api/organizations')
            .set('tj-workspace-id', userData.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie)
            .send({ name: 'My workspace' })
            .expect(403);
        });
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
