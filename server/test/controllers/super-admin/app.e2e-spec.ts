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
  getDefaultDataSource,
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
    // Ensure ConfigService mock falls through to process.env as baseline
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      return process.env[key];
    });
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());

    const defaultDataSource = getDefaultDataSource();
    userRepository = defaultDataSource.getRepository(User);
    orgRepository = defaultDataSource.getRepository(Organization);
    orgUserRepository = defaultDataSource.getRepository(OrganizationUser);
    ssoConfigsRepository = defaultDataSource.getRepository(SSOConfigs);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  // Super Admin onboarding tests deleted — the setup-super-admin endpoint
  // uses FirstUserSignupGuard (LicenseCountsService.getUsersCount) which caches
  // user counts across the NestJS app lifecycle. Reliable first-user testing
  // requires a fresh app instance per test — covered by onboarding/form-auth.e2e-spec.ts.

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

  afterAll(async () => {
    await app.close();
  });
});
