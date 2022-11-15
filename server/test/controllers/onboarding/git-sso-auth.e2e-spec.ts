import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { authHeaderForUser, clearDB, createNestAppInstanceWithEnvMock, createSSOMockConfig } from '../../test.helper';
import { getManager, Repository } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import got from 'got';

jest.mock('got');
const mockedGot = mocked(got);

describe('Git Onboarding', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let orgUserRepository: Repository<OrganizationUser>;
  let current_user: User;
  let current_organization: Organization;
  let org_user: User;
  let org_user_organization: Organization;
  let mockConfig;

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
          const gitAuthResponse = jest.fn();
          gitAuthResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  access_token: 'some-access-token',
                  scope: 'scope',
                  token_type: 'bearer',
                };
              },
            };
          });
          const gitGetUserResponse = jest.fn();
          gitGetUserResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  name: 'SSO UserGit',
                  email: 'ssousergit@tooljet.com',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          const manager = getManager();
          const user = await manager.findOneOrFail(User, {
            where: { email: 'ssousergit@tooljet.com' },
            relations: ['organization'],
          });
          current_user = user;
          current_organization = user.organization;

          const redirect_url = `${process.env['TOOLJET_HOST']}/invitations/${user.invitationToken}?source=sso`;

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('should return user info while verifying invitation token', async () => {
          const { body } = await verifyInviteToken(current_user);
          expect(body?.email).toEqual('ssousergit@tooljet.com');
          expect(body?.name).toEqual('SSO UserGit');
        });

        it('should setup user account with invitation token', async () => {
          const { invitationToken } = current_user;
          const payload = {
            token: invitationToken,
            password: 'password',
          };
          await setUpAccountFromToken(current_user, current_organization, payload);
        });

        it('should allow user to view apps', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('Authorization', authHeaderForUser(current_user));

          expect(response.statusCode).toBe(200);
        });
      });

      describe("Invite User that doesn't exists in an organization", () => {
        it('should send invitation link to the user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'org_user@tooljet.com', first_name: 'test', last_name: 'test' })
            .set('Authorization', authHeaderForUser(current_user));
          const { status } = response;
          expect(status).toBe(201);
        });

        it('should verify token', async () => {
          const user = await userRepository.findOneOrFail({ where: { email: 'org_user@tooljet.com' } });
          org_user = user;
          const { body } = await verifyInviteToken(org_user);
          expect(body?.email).toEqual('org_user@tooljet.com');
          expect(body?.name).toEqual('test test');
        });

        it('should setup user account using invitation token (setup-account-from-token)', async () => {
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
            source: 'sso',
          };
          await setUpAccountFromToken(org_user, org_user_organization, payload);
        });

        it('should allow user to view apps', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('Authorization', authHeaderForUser(org_user));

          expect(response.statusCode).toBe(200);
        });
      });

      describe('Invite user that already exist in an organization', () => {
        let orgInvitationToken: string;
        let invitedUser: User;

        it('should send invitation link to the user', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/organization_users')
            .send({ email: 'ssousergit@tooljet.com' })
            .set('Authorization', authHeaderForUser(org_user));
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
          expect(email).toEqual('ssousergit@tooljet.com');
          expect(name).toEqual('SSO UserGit');
        });

        it('should accept invite and add user to the organization (accept-invite)', async () => {
          await request(app.getHttpServer()).post(`/api/accept-invite`).send({ token: orgInvitationToken }).expect(201);
        });

        it('should allow the new user to view apps', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/apps`)
            .set('Authorization', authHeaderForUser(invitedUser));

          expect(response.statusCode).toBe(200);
        });
      });
    });
  });

  afterAll(async () => {
    await clearDB();
    await app.close();
  });

  const setUpAccountFromToken = async (user: User, org: Organization, payload) => {
    const response = await request(app.getHttpServer()).post('/api/setup-account-from-token').send(payload);
    const { status } = response;
    expect(status).toBe(201);

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

    expect(email).toEqual(user.email);
    expect(first_name).toEqual(user.firstName);
    expect(last_name).toEqual(user.lastName);
    expect(admin).toBeTruthy();
    expect(organization_id).toBe(org.id);
    expect(organization).toBe(org.name);
    expect(group_permissions).toHaveLength(2);
    expect(group_permissions.some((gp) => gp.group === 'all_users')).toBeTruthy();
    expect(group_permissions.some((gp) => gp.group === 'admin')).toBeTruthy();
    expect(Object.keys(group_permissions[0]).sort()).toEqual(
      [
        'id',
        'organization_id',
        'group',
        'app_create',
        'app_delete',
        'updated_at',
        'created_at',
        'folder_create',
        'org_environment_variable_create',
        'org_environment_variable_update',
        'org_environment_variable_delete',
        'folder_delete',
        'folder_update',
      ].sort()
    );
    expect(app_group_permissions).toHaveLength(0);
    await user.reload();
    expect(user.status).toBe('active');
    expect(user.defaultOrganizationId).toBe(org.id);
  };

  const verifyInviteToken = async (user: User) => {
    const { invitationToken } = user;
    const { invitationToken: orgInviteToken } = await orgUserRepository.findOneOrFail({
      where: { userId: user.id },
    });
    const response = await request(app.getHttpServer()).get(
      `/api/verify-invite-token?token=${invitationToken}${orgInviteToken && `&organizationToken=${orgInviteToken}`}`
    );
    const {
      body: { onboarding_details },
      status,
    } = response;

    expect(status).toBe(200);
    expect(Object.keys(onboarding_details)).toEqual(['password', 'questions']);
    await user.reload();
    expect(user.status).toBe('verified');
    return response;
  };
});
