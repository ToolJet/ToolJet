import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import {
  resetDB,
  initTestApp,
  createUser,
  login,
  getEntityRepository,
  closeTestApp,
} from 'test-helper';
import { Repository } from 'typeorm';

/**
 * @group platform
 */
describe('OnboardingController', () => {
  describe('EE (plan: enterprise)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let configService: ConfigService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    configService = app.get(ConfigService);
    userRepository = getEntityRepository(User);
    orgRepository = getEntityRepository(Organization);
    orgUserRepository = getEntityRepository(OrganizationUser);
  });

  beforeEach(async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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

  describe('POST /api/onboarding/setup-super-admin | Setup super admin', () => {
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

  describe('POST /api/onboarding/signup | User signup', () => {
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
      const loggedUser = await login(app, user.email);

      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/organization-users | Invite user', () => {
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
      loggedAdmin = await login(app, adminUser.email);
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

      // Accept the invite | requires the invited user to be authenticated
      const loggedOther = await login(app, otherUser.email);
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

  describe('Signup and invite interaction', () => {
    it('should not allow signup for an already-invited user (source: invite)', async () => {
      const { user, organization } = await createUser(app, {
        firstName: 'admin',
        lastName: 'admin',
        email: 'admin@tooljet.com',
        status: 'active',
      });
      const loggedAdmin = await login(app, user.email);

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
      const loggedAdmin = await login(app, adminUser.email);

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

  describe('POST /api/onboarding/activate-account-with-token | Invite token handling', () => {
    /**
     * Regression: activateOrganization was called unconditionally on the defaultOrganizationUser.
     * When defaultOrg === invitedOrg (brand-new invite), that cleared invitationToken on the org-user
     * row before the accept-invite page could consume it, causing the guard to return null and throw
     * "Invalid invitation link".
     *
     * Fix: only activate the default org when its ID differs from the invited org's ID.
     */
    it('should preserve org-user invitationToken when invited org equals default org', async () => {
      const { user: admin, organization: orgA } = await createUser(app, {
        email: 'admin-token-preserve@tooljet.com',
        status: 'active',
      });
      const adminSession = await login(app, admin.email);

      // Invite a brand-new user to org A
      await request(app.getHttpServer())
        .post('/api/organization-users')
        .send({ email: 'invited-token-preserve@tooljet.com', firstName: 'Token', lastName: 'Test', role: 'end-user' })
        .set('tj-workspace-id', admin.defaultOrganizationId)
        .set('Cookie', adminSession.tokenCookie)
        .expect(201);

      // Capture the org-user's invitationToken before activation
      const invitedUserRecord = await userRepository.findOneOrFail({
        where: { email: 'invited-token-preserve@tooljet.com' },
      });
      const orgUserBefore = await orgUserRepository.findOneOrFail({
        where: { userId: invitedUserRecord.id, organizationId: orgA.id },
      });
      const orgInviteToken = orgUserBefore.invitationToken;
      expect(orgInviteToken).not.toBeNull();

      // Activate account — simulates the signup redirect flow
      await request(app.getHttpServer())
        .post('/api/onboarding/activate-account-with-token')
        .send({
          email: 'invited-token-preserve@tooljet.com',
          password: 'Password@123',
          organizationToken: orgInviteToken,
        })
        .expect(201);

      // Token must still be in the org-user row — accept-invite page hasn't consumed it yet
      const orgUserAfter = await orgUserRepository.findOneOrFail({
        where: { userId: invitedUserRecord.id, organizationId: orgA.id },
      });
      expect(orgUserAfter.invitationToken).toBe(orgInviteToken);

      // verify-organization-token must resolve — this is what the accept-invite page calls
      const verifyResponse = await request(app.getHttpServer()).get(
        `/api/onboarding/verify-organization-token?token=${orgInviteToken}`
      );
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.email).toBe('invited-token-preserve@tooljet.com');
    });

    /**
     * Super-admin cross-org path: user's defaultOrg (A) differs from the invited org (B).
     * activateOrganization SHOULD fire on org A's org-user (existing behavior).
     * Org B's invitationToken must remain intact for the accept-invite step.
     */
    it('should activate default-org user and preserve invited-org token when orgs differ', async () => {
      // Create org A — this becomes crossUser's defaultOrg
      const { organization: orgA } = await createUser(app, {
        email: 'orgA-admin-crossorg@tooljet.com',
        status: 'active',
      });

      // crossUser is created with defaultOrg = orgA, org-user in orgA has status 'invited'
      const { user: crossUser } = await createUser(app, {
        email: 'cross-org-user@tooljet.com',
        status: 'invited',
        organization: orgA,
      });

      // Create org B (separate workspace)
      const { organization: orgB } = await createUser(app, {
        email: 'orgB-admin-crossorg@tooljet.com',
        status: 'active',
      });

      // Manually seed org B's org-user for crossUser (simulates super-admin invite)
      const orgBInviteToken = uuidv4();
      await orgUserRepository.save(
        orgUserRepository.create({
          user: crossUser,
          organization: orgB,
          invitationToken: orgBInviteToken,
          status: 'invited',
          role: 'all_users',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      // Activate using org B's token (crossUser's defaultOrg is org A — they differ)
      await request(app.getHttpServer())
        .post('/api/onboarding/activate-account-with-token')
        .send({
          email: 'cross-org-user@tooljet.com',
          password: 'Password@123',
          organizationToken: orgBInviteToken,
        })
        .expect(201);

      // Org A's org-user (the default org) must now be ACTIVE with its token cleared
      const orgAUserAfter = await orgUserRepository.findOneOrFail({
        where: { userId: crossUser.id, organizationId: orgA.id },
      });
      expect(orgAUserAfter.status).toBe('active');
      expect(orgAUserAfter.invitationToken).toBeNull();

      // Org B's invitationToken must be intact — accept-invite page still needs it
      const orgBUserAfter = await orgUserRepository.findOneOrFail({
        where: { userId: crossUser.id, organizationId: orgB.id },
      });
      expect(orgBUserAfter.invitationToken).toBe(orgBInviteToken);
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);
  });
});
