import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import {
  clearDB,
  createNestAppInstanceWithEnvMock,
  createUser,
  verifyInviteToken,
  setUpAccountFromToken,
  authenticateUser,
} from '../../test.helper';
import { Repository } from 'typeorm';

describe('Form Onboarding', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let current_user: User;
  let loggedUser: any;
  let loggedOrgUser: any;
  let current_organization: Organization;
  let org_user: User;
  let org_user_organization: Organization;
  let mockConfig;

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    userRepository = app.get('UserRepository');
    orgRepository = app.get('OrganizationRepository');
    orgUserRepository = app.get('OrganizationUserRepository');
    await clearDB();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Multi Organization Operations', () => {
    beforeEach(async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_MULTI_WORKSPACE':
            return 'false';
          default:
            return process.env[key];
        }
      });
    });
    describe('Signup user and invite users', () => {
      describe('Signup first user', () => {
        it('should throw error if the user is trying to signup as first user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'admin@tooljet.com', name: 'Admin', password: 'password' });

          expect(response.statusCode).toBe(403);
        });

        it('first user should only be sign up through /setup-admin api', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/setup-admin')
            .send({ email: 'firstuser@tooljet.com', name: 'Admin', password: 'password', workspace: 'tooljet' });
          expect(response.statusCode).toBe(201);
        });
      });

      describe('Signup user', () => {
        it('should signup organization admin', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'admin@tooljet.com', name: 'Admin', password: 'password' });
          expect(response.statusCode).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'admin@tooljet.com' },
            relations: ['organizationUsers'],
          });
          current_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          current_organization = organization;

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
        });

        it('should verify invitation token of user', async () => {
          const { body } = await verifyInviteToken(app, current_user);
          expect(body?.email).toEqual('admin@tooljet.com');
          expect(body?.name).toEqual('Admin');
        });

        it('should return user info and setup user account using invitation token (setup-account-from-token)', async () => {
          const { invitationToken } = current_user;
          const payload = {
            token: invitationToken,
          };
          await setUpAccountFromToken(app, current_user, current_organization, payload);
        });

        it('should allow user to view apps', async () => {
          loggedUser = await authenticateUser(app, current_user.email);
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);
        });
      });

      describe("Invite User that doesn't exist in any organization", () => {
        it('should send invitation link to the user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'org_user@tooljet.com', first_name: 'test', last_name: 'test' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should verify token', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'org_user@tooljet.com' } });
          org_user = user;
          const { body } = await verifyInviteToken(app, org_user);
          expect(body?.email).toEqual('org_user@tooljet.com');
          expect(body?.name).toEqual('test test');
        });

        it('should setup org user account using invitation token (setup-account-from-token)', async () => {
          const { invitationToken } = org_user;
          const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
            where: { userId: org_user.id },
          });
          const organization = await orgRepository.findOneOrFail({
            where: { id: org_user?.organizationUsers?.[0]?.organizationId },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            organization_token: orgInviteToken,
            password: 'password',
          };
          await setUpAccountFromToken(app, org_user, org_user_organization, payload);
        });

        it('should allow user to view apps', async () => {
          loggedOrgUser = await authenticateUser(app, org_user.email);
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('tj-workspace-id', org_user?.defaultOrganizationId)
            .set('Cookie', loggedOrgUser.tokenCookie);

          expect(response.statusCode).toBe(200);
        });
      });

      describe('Invite User that exists in an organization', () => {
        let orgInvitationToken: string;
        let invitedUser: User;

        it('should send invitation link to the user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'admin@tooljet.com' })
            .set('tj-workspace-id', org_user?.defaultOrganizationId)
            .set('Cookie', loggedOrgUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should verify organization token (verify-organization-token)', async () => {
          const { user, invitationToken } = await orgUserRepository.findOneOrFail({
            where: {
              userId: current_user.id,
              organizationId: org_user_organization.id,
            },
            relations: ['user'],
          });
          orgInvitationToken = invitationToken;
          invitedUser = user;

          const response = await request(app.getHttpServer()).get(
            `/api/verify-organization-token?token=${invitationToken}`
          );
          const {
            body: { email, name, onboarding_details },
            status,
          } = response;

          expect(status).toBe(200);
          expect(Object.keys(onboarding_details)).toEqual(['password']);
          await invitedUser.reload();
          expect(invitedUser.status).toBe('active');
          expect(email).toEqual('admin@tooljet.com');
          expect(name).toEqual('Admin');
        });

        it('should accept invite and add user to the organization (accept-invite)', async () => {
          await request(app.getHttpServer()).post(`/api/accept-invite`).send({ token: orgInvitationToken }).expect(201);
        });

        it('should allow the new user to view apps', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('tj-workspace-id', invitedUser?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);

          expect(response.statusCode).toBe(200);
        });
      });
    });
    describe('Signup and invite url should both work unless one of them is consumed', () => {
      describe('Signup url should work even if the user is invited to another organization', () => {
        beforeAll(async () => {
          await clearDB();
          const { user, organization } = await createUser(app, {
            firstName: 'admin',
            lastName: 'admin',
            email: 'admin@tooljet.com',
            status: 'active',
          });
          current_user = user;
          current_organization = organization;
          loggedUser = await authenticateUser(app, user.email);
        });
        it('should signup user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'another_user@tooljet.com', name: 'another user', password: 'password' });
          expect(response.statusCode).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'another_user@tooljet.com' },
            relations: ['organizationUsers'],
          });
          org_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          org_user_organization = organization;

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('invited');
          expect(user.source).toBe('signup');
        });

        it('should invite signed up user to another workspace', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'another_user@tooljet.com' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should verify if signup url is still valid for the invited user', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'another_user@tooljet.com' } });
          org_user = user;
          const { body, status } = await verifyInviteToken(app, org_user, true);
          expect(status).toBe(200);
          expect(body?.email).toEqual('another_user@tooljet.com');
          expect(body?.name).toEqual('another user');
          const { invitationToken } = org_user;
          const organization = await orgRepository.findOneOrFail({
            where: { id: org_user?.organizationUsers?.[0]?.organizationId },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            password: 'password',
          };
          await setUpAccountFromToken(app, org_user, org_user_organization, payload);
        });
      });

      describe('Invite url should work even if the user has signed up earlier', () => {
        beforeAll(async () => {
          await clearDB();
          const { user, organization } = await createUser(app, {
            firstName: 'admin',
            lastName: 'admin',
            email: 'admin@tooljet.com',
            status: 'active',
          });
          current_user = user;
          current_organization = organization;
          loggedUser = await authenticateUser(app, user.email);
        });
        it('should signup user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'another_user@tooljet.com', name: 'another user', password: 'password' });
          expect(response.statusCode).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'another_user@tooljet.com' },
            relations: ['organizationUsers'],
          });
          org_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          org_user_organization = organization;

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('invited');
          expect(user.source).toBe('signup');
        });

        it('should invite a user to another workspace', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'another_user@tooljet.com' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should verify if invite url is still valid for the invited user', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'another_user@tooljet.com' } });
          org_user = user;
          const { body, status } = await verifyInviteToken(app, org_user);
          expect(status).toBe(200);
          expect(body?.email).toEqual('another_user@tooljet.com');
          expect(body?.name).toEqual('another user');
          const { invitationToken } = org_user;
          const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
            where: { userId: org_user.id },
          });
          const organization = await orgRepository.findOneOrFail({
            where: { id: org_user?.organizationUsers?.[0]?.organizationId },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            password: 'password',
            organizationToken: orgInviteToken,
          };
          await setUpAccountFromToken(app, org_user, org_user_organization, payload);
        });
      });

      describe('Invite url should work', () => {
        beforeAll(async () => {
          await clearDB();
          const { user, organization } = await createUser(app, {
            firstName: 'admin',
            lastName: 'admin',
            email: 'admin@tooljet.com',
            status: 'active',
          });
          current_user = user;
          current_organization = organization;
          loggedUser = await authenticateUser(app, 'admin@tooljet.com');
        });
        it('should invite user to another workspace', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'another_user@tooljet.com', first_name: 'another', last_name: 'user', password: 'password' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'another_user@tooljet.com' },
            relations: ['organizationUsers'],
          });
          org_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          org_user_organization = organization;

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('invited');
          expect(user.source).toBe('invite');
        });

        it('should not signup the same invited user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'another_user@tooljet.com', name: 'another user', password: 'password' });
          expect(response.statusCode).toBe(406);
        });

        it('should verify if invite url is still valid for the signed up user', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'another_user@tooljet.com' } });
          org_user = user;
          const { body, status } = await verifyInviteToken(app, org_user);
          expect(status).toBe(200);
          expect(body?.email).toEqual('another_user@tooljet.com');
          expect(body?.name).toEqual('another user');
          const { invitationToken } = org_user;
          const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
            where: { userId: org_user.id },
          });
          const organization = await orgRepository.findOneOrFail({
            where: { id: org_user?.organizationUsers?.[0]?.organizationId },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            password: 'password',
            organizationToken: orgInviteToken,
          };
          await setUpAccountFromToken(app, org_user, org_user_organization, payload);
        });
      });

      describe('Signup url should work', () => {
        beforeAll(async () => {
          await clearDB();
          const { user, organization } = await createUser(app, {
            firstName: 'admin',
            lastName: 'admin',
            email: 'admin@tooljet.com',
            status: 'active',
          });
          current_user = user;
          current_organization = organization;
          loggedUser = await authenticateUser(app, user.email);
        });
        it('should invite user to another workspace', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'another_user@tooljet.com', first_name: 'another', last_name: 'user', password: 'password' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);

          const user = await userRepository.findOneOrFail({
            where: { email: 'another_user@tooljet.com' },
            relations: ['organizationUsers'],
          });
          org_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          org_user_organization = organization;

          expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('invited');
          expect(user.source).toBe('invite');
        });

        it('should not signup the same invited user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .send({ email: 'another_user@tooljet.com', name: 'another user', password: 'password' });
          expect(response.statusCode).toBe(406);
        });

        it('should verify if signup url is still valid for the invited user', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'another_user@tooljet.com' } });
          org_user = user;
          const { body, status } = await verifyInviteToken(app, org_user, true);
          expect(status).toBe(200);
          expect(body?.email).toEqual('another_user@tooljet.com');
          expect(body?.name).toEqual('another user');
          const { invitationToken } = org_user;
          const organization = await orgRepository.findOneOrFail({
            where: { id: org_user?.organizationUsers?.[0]?.organizationId },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            password: 'password',
          };
          await setUpAccountFromToken(app, org_user, org_user_organization, payload);
        });
      });
    });
  });

  afterAll(async () => {
    await clearDB();
    await app.close();
  });
});
