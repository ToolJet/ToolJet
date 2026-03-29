import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import {
  clearDB,
  createNestAppInstanceWithEnvMock,
  createUser,
  authenticateUser,
  getDefaultDataSource,
} from '../../test.helper';
import { Repository } from 'typeorm';

/**
 * Form Onboarding — EE edition.
 *
 * In EE, users are auto-activated on signup (no email-verification / invite-token
 * flow). The tests below verify:
 *   1. Super-admin setup (first user)
 *   2. Subsequent user signup (auto-activated, returns login payload)
 *   3. Inviting users to workspaces
 *   4. Workspace access after invite
 *   5. Signup/invite interaction rules
 */
describe('Form Onboarding', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let mockConfig;

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    const defaultDataSource = getDefaultDataSource();
    userRepository = defaultDataSource.getRepository(User);
    orgRepository = defaultDataSource.getRepository(Organization);
    orgUserRepository = defaultDataSource.getRepository(OrganizationUser);
  });

  beforeEach(async () => {
    await clearDB();
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      switch (key) {
        case 'DISABLE_MULTI_WORKSPACE':
          return 'false';
        default:
          return process.env[key];
      }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Super admin setup', () => {
    it('should reject signup when no super admin exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/onboarding/signup')
        .send({ email: 'admin@tooljet.com', name: 'Admin', password: 'password' });

      expect(response.statusCode).toBe(403);
    });

    it('should setup super admin through /setup-super-admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/onboarding/setup-super-admin')
        .send({
          email: 'firstuser@tooljet.com',
          name: 'First Admin',
          password: 'password',
          workspace: 'tooljet',
          workspaceName: 'tooljet',
        });
      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'firstuser@tooljet.com' },
      });
      expect(user.status).toBe('active');
    });
  });

  describe('User signup (EE auto-activation)', () => {
    it('should signup and auto-activate a new user', async () => {
      // First set up a super admin so signup is allowed
      await request(app.getHttpServer())
        .post('/api/onboarding/setup-super-admin')
        .send({
          email: 'firstuser@tooljet.com',
          name: 'First Admin',
          password: 'password',
          workspace: 'tooljet',
          workspaceName: 'tooljet',
        });

      const response = await request(app.getHttpServer())
        .post('/api/onboarding/signup')
        .send({ email: 'newuser@tooljet.com', name: 'New User', password: 'password' });
      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'newuser@tooljet.com' },
        relations: ['organizationUsers'],
      });

      // EE auto-activates users on signup
      expect(user.status).toBe('active');
      expect(user.invitationToken).toBeNull();
      expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
    });

    it('should allow auto-activated user to view apps', async () => {
      // Setup super admin + signup
      await request(app.getHttpServer())
        .post('/api/onboarding/setup-super-admin')
        .send({
          email: 'firstuser@tooljet.com',
          name: 'First Admin',
          password: 'password',
          workspace: 'tooljet',
          workspaceName: 'tooljet',
        });

      await request(app.getHttpServer())
        .post('/api/onboarding/signup')
        .send({ email: 'newuser@tooljet.com', name: 'New User', password: 'password' });

      const user = await userRepository.findOneOrFail({ where: { email: 'newuser@tooljet.com' } });
      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Invite user to workspace', () => {
    let adminUser: User;
    let adminOrg: Organization;
    let loggedAdmin: any;

    beforeEach(async () => {
      const { user, organization } = await createUser(app, {
        firstName: 'admin',
        lastName: 'admin',
        email: 'admin@tooljet.com',
        status: 'active',
      });
      adminUser = user;
      adminOrg = organization;
      loggedAdmin = await authenticateUser(app, adminUser.email);
    });

    it('should invite a new user to the workspace', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'org_user@tooljet.com', firstName: 'test', lastName: 'test', role: 'end-user' })
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie);
      expect(response.status).toBe(201);

      const user = await userRepository.findOneOrFail({
        where: { email: 'org_user@tooljet.com' },
      });
      expect(user.firstName).toEqual('test');
      expect(user.lastName).toEqual('test');

      const orgUser = await orgUserRepository.findOneOrFail({
        where: { userId: user.id, organizationId: adminOrg.id },
      });
      expect(orgUser).toBeDefined();
    });

    it('should invite an existing user to a different workspace', async () => {
      // Create another user in a separate workspace
      const { user: otherUser } = await createUser(app, {
        firstName: 'Other',
        lastName: 'User',
        email: 'other@tooljet.com',
        status: 'active',
      });

      // Invite the other user to admin's workspace
      const response = await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'other@tooljet.com', role: 'end-user' })
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie);
      expect(response.status).toBe(201);

      // Verify the user now has an org-user record in admin's workspace
      const orgUser = await orgUserRepository.findOneOrFail({
        where: { userId: otherUser.id, organizationId: adminOrg.id },
      });
      expect(orgUser).toBeDefined();
    });

    it('should verify organization invite token for cross-workspace invite', async () => {
      // Create another user in a separate workspace
      await createUser(app, {
        firstName: 'Other',
        lastName: 'User',
        email: 'other@tooljet.com',
        status: 'active',
      });

      // Invite the other user to admin's workspace
      await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'other@tooljet.com', role: 'end-user' })
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie)
        .expect(201);

      // Find the org invite token
      const otherUser = await userRepository.findOneOrFail({ where: { email: 'other@tooljet.com' } });
      const { invitationToken } = await orgUserRepository.findOneOrFail({
        where: { userId: otherUser.id, organizationId: adminOrg.id },
      });

      const response = await request(app.getHttpServer()).get(
        `/api/onboarding/verify-organization-token?token=${invitationToken}`
      );
      expect(response.status).toBe(200);
      expect(response.body.email).toEqual('other@tooljet.com');
    });

    it('should accept a workspace invite', async () => {
      // Create another user in a separate workspace
      await createUser(app, {
        firstName: 'Other',
        lastName: 'User',
        email: 'other@tooljet.com',
        status: 'active',
      });

      // Invite the other user
      await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'other@tooljet.com', role: 'end-user' })
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie)
        .expect(201);

      // Get the invitation token
      const otherUser = await userRepository.findOneOrFail({ where: { email: 'other@tooljet.com' } });
      const { invitationToken } = await orgUserRepository.findOneOrFail({
        where: { userId: otherUser.id, organizationId: adminOrg.id },
      });

      // Accept the invite — requires the invited user to be authenticated
      const loggedOther = await authenticateUser(app, otherUser.email);
      await request(app.getHttpServer())
        .post('/api/onboarding/accept-invite')
        .send({ token: invitationToken })
        .set('Cookie', loggedOther.tokenCookie)
        .expect(201);

      // Verify the org user is now active
      const orgUser = await orgUserRepository.findOneOrFail({
        where: { userId: otherUser.id, organizationId: adminOrg.id },
      });
      expect(orgUser.status).toBe('active');
    });
  });

  describe('Signup and invite interaction rules', () => {
    it('should not allow signup for an already-invited user (source: invite)', async () => {
      const { user, organization } = await createUser(app, {
        firstName: 'admin',
        lastName: 'admin',
        email: 'admin@tooljet.com',
        status: 'active',
      });
      const loggedAdmin = await authenticateUser(app, user.email);

      // Invite a user
      await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'invited@tooljet.com', firstName: 'Invited', lastName: 'User', role: 'end-user' })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie)
        .expect(201);

      // Attempting to signup the same user should fail
      const response = await request(app.getHttpServer())
        .post('/api/onboarding/signup')
        .send({ email: 'invited@tooljet.com', name: 'Invited User', password: 'password' });
      expect(response.statusCode).toBe(406);
    });

    it('should allow inviting a user who signed up separately', async () => {
      // First set up super admin so signup is allowed
      await request(app.getHttpServer())
        .post('/api/onboarding/setup-super-admin')
        .send({
          email: 'firstuser@tooljet.com',
          name: 'First Admin',
          password: 'password',
          workspace: 'tooljet',
          workspaceName: 'tooljet',
        });

      // Create an admin user (via createUser for proper admin role)
      const { user: adminUser } = await createUser(app, {
        firstName: 'admin',
        lastName: 'admin',
        email: 'admin@tooljet.com',
        status: 'active',
      });
      const loggedAdmin = await authenticateUser(app, adminUser.email);

      // Signup another user independently
      await request(app.getHttpServer())
        .post('/api/onboarding/signup')
        .send({ email: 'newuser@tooljet.com', name: 'New User', password: 'password' })
        .expect(201);

      // Invite the already-existing user to admin's workspace
      const response = await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'newuser@tooljet.com', role: 'end-user' })
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedAdmin.tokenCookie);
      expect(response.status).toBe(201);

      // Verify the user now has an org-user record in the admin's workspace
      const newUser = await userRepository.findOneOrFail({ where: { email: 'newuser@tooljet.com' } });
      const orgUser = await orgUserRepository.findOneOrFail({
        where: { userId: newUser.id, organizationId: adminUser.defaultOrganizationId },
      });
      expect(orgUser).toBeDefined();
    });
  });

  afterAll(async () => {
    await clearDB();
    await app.close();
  });
});
