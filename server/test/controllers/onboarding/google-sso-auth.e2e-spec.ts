import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import {
  authenticateUser,
  clearDB,
  createFirstUser,
  createNestAppInstanceWithEnvMock,
  createSSOMockConfig,
  createUser,
  generateRedirectUrl,
  getPathFromUrl,
  setUpAccountFromToken,
  verifyInviteToken,
} from '../../test.helper';
import { getManager, Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';

describe('Google SSO Onboarding', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let current_user: User;
  let current_organization: Organization;
  let org_user: User;
  let org_user_organization: Organization;
  let ssoRedirectUrl: string;
  let signupUrl: string;
  let mockConfig;
  let loggedUser: any;
  let loggedOrgUser: any;

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    userRepository = app.get('UserRepository');
    orgRepository = app.get('OrganizationRepository');
    orgUserRepository = app.get('OrganizationUserRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Multi Organization Operations', () => {
    const token = 'some-token';

    beforeEach(() => {
      createSSOMockConfig(mockConfig);
    });

    describe('Signup and invite users', () => {
      describe('should signup admin user', () => {
        it("should return redirect url when user doesn't exist", async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'ssouser@tooljet.com',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          const manager = getManager();
          const user = await manager.findOneOrFail(User, {
            where: { email: 'ssouser@tooljet.com' },
            relations: ['organization'],
          });
          current_user = user;
          current_organization = user.organization;

          const redirect_url = await generateRedirectUrl('ssouser@tooljet.com');

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('should return user info while verifying invitation token', async () => {
          const { body } = await verifyInviteToken(app, current_user, true);
          expect(body?.email).toEqual('ssouser@tooljet.com');
          expect(body?.name).toEqual('SSO User');
        });

        it('should setup user account with invitation token', async () => {
          const { invitationToken } = current_user;
          const payload = {
            token: invitationToken,
            password: 'password',
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

      describe("Invite User that doesn't exists in an organization", () => {
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

        it('should setup user account using invitation token (setup-account-from-token)', async () => {
          const { invitationToken } = org_user;
          const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
            where: { userId: org_user.id },
          });
          const organization = await orgRepository.findOneOrFail({
            where: {
              id: org_user?.organizationUsers?.find((ou) => ou.status === WORKSPACE_USER_STATUS.INVITED)
                ?.organizationId,
            },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            organization_token: orgInviteToken,
            password: 'password',
            source: 'sso',
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

      describe('Invite user that already exist in an organization', () => {
        let orgInvitationToken: string;
        let invitedUser: User;

        it('should send invitation link to the user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'ssouser@tooljet.com' })
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
          expect(email).toEqual('ssouser@tooljet.com');
          expect(name).toEqual('SSO User');
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

    describe('Signup and invite url should work unless one of them is consumed', () => {
      describe('Redirect url should be same as signup url', () => {
        beforeAll(async () => {
          await clearDB();
        });

        it('should signup a user', async () => {
          await createFirstUser(app);
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'admin@tooljet.com', name: 'admin admin', password: 'password' });
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

          //expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('invited');
          expect(user.source).toBe('signup');
        });

        it('should signup the same user using sso', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'admin@tooljet.com',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          const manager = getManager();
          const user = await manager.findOneOrFail(User, {
            where: { email: 'admin@tooljet.com' },
            relations: ['organization'],
          });
          current_user = user;
          current_organization = user.organization;

          ssoRedirectUrl = await generateRedirectUrl('admin@tooljet.com');
          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(ssoRedirectUrl);
        });

        it('should verify if base signup url and redirect url are equal', async () => {
          signupUrl = await generateRedirectUrl('admin@tooljet.com', undefined, undefined, false);
          expect(getPathFromUrl(ssoRedirectUrl)).toEqual(signupUrl);
        });
      });

      describe('Setup account should work from sso link', () => {
        beforeAll(async () => {
          await clearDB();
        });

        it('should signup the user using sso', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'admin@tooljet.com',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          ssoRedirectUrl = await generateRedirectUrl('admin@tooljet.com');
          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(ssoRedirectUrl);

          const user = await userRepository.findOneOrFail({
            where: { email: 'admin@tooljet.com' },
            relations: ['organizationUsers'],
          });
          current_user = user;

          const organization = await orgRepository.findOneOrFail({
            where: { id: user?.organizationUsers?.[0]?.organizationId },
          });
          current_organization = organization;

          //expect(user.defaultOrganizationId).toBe(user?.organizationUsers?.[0]?.organizationId);
          expect(user.status).toBe('verified');
          expect(user.source).toBe('google');
        });

        it('should not signup same user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/signup')
            .send({ email: 'admin@tooljet.com', name: 'admin admin', password: 'password' });
          expect(response.statusCode).toBe(406);
        });

        it('should setup account for user using sso link', async () => {
          const { invitationToken } = current_user;
          const organization = await orgRepository.findOneOrFail({
            where: { id: current_user?.organizationUsers?.[0]?.organizationId },
          });

          current_organization = organization;
          const payload = {
            token: invitationToken,
            password: 'password',
            source: 'sso',
          };
          await setUpAccountFromToken(app, current_user, current_organization, payload);
        });
      });

      describe('Invite link should work after setting up account through sso signup', () => {
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
        });

        it('should send invitation link to the user', async () => {
          loggedUser = await authenticateUser(app, current_user.email);
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'org_user@tooljet.com', first_name: 'test', last_name: 'test' })
            .set('tj-workspace-id', current_user?.defaultOrganizationId)
            .set('Cookie', loggedUser.tokenCookie);
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should signup the user using sso', async () => {
          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'org_user@tooljet.com',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token });

          ssoRedirectUrl = await generateRedirectUrl('org_user@tooljet.com');
          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(ssoRedirectUrl);
        });

        it('should setup account for user using sso link', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'org_user@tooljet.com' } });
          org_user = user;
          const { invitationToken } = org_user;
          const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
            where: { userId: org_user.id },
          });
          const organization = await orgRepository.findOneOrFail({
            where: {
              id: org_user?.organizationUsers?.find((ou) => ou.status === WORKSPACE_USER_STATUS.INVITED)
                ?.organizationId,
            },
          });

          org_user_organization = organization;
          const payload = {
            token: invitationToken,
            organization_token: orgInviteToken,
            password: 'password',
            source: 'sso',
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
