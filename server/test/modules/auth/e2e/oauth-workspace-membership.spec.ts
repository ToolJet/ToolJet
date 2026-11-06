import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { createUser, initTestApp, closeTestApp, getEntityRepository } from 'test-helper';
import { Organization } from '@entities/organization.entity';
import { SSOConfigs } from '@entities/sso_config.entity';
import { User } from '@entities/user.entity';
import UserResponse from '@modules/auth/oauth/models/user_response';
import { GitOAuthService } from '@modules/auth/oauth/util-services/git-oauth.service';

/** @group platform */
describe('OAuthController | workspace GitHub sign-in with a custom host', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let workspaceA: Organization;
  let workspaceB: Organization;
  let gitA: SSOConfigs;
  const previousMode = process.env.SSO_WORKSPACE_ISOLATION;

  const signIn = (email: string) => {
    jest.spyOn(GitOAuthService.prototype, 'signIn').mockResolvedValue({
      userSSOId: email,
      firstName: 'Member',
      lastName: 'One',
      email,
      sso: 'git',
    } as UserResponse);
    return request(app.getHttpServer()).post(`/api/oauth/sign-in/${gitA.id}`).send({ token: 'code' });
  };

  beforeAll(async () => {
    process.env.SSO_WORKSPACE_ISOLATION = 'enforce';
    ({ app } = await initTestApp());
    userRepository = getEntityRepository(User);
    ({ organization: workspaceA } = await createUser(app, {
      email: 'owner-a@a.example.test',
      enableSignUp: true,
      ssoConfigs: [
        { sso: 'git', enabled: true, configs: { clientId: 'client', hostName: 'https://git.a.example.test' } },
      ] as never,
    }));
    ({ organization: workspaceB } = await createUser(app, { email: 'owner-b@b.example.test' }));
    gitA = workspaceA.ssoConfigs.find((config) => config.sso === 'git');
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    process.env.SSO_WORKSPACE_ISOLATION = previousMode;
    await closeTestApp(app);
  }, 60_000);

  it('should return 401 for an account from another workspace and leave it unchanged', async () => {
    const email = 'member-b@b.example.test';
    await createUser(app, { email, organization: workspaceB, groups: ['end-user'] });
    const before = await userRepository.findOneOrFail({ where: { email } });

    const response = await signIn(email);

    expect(response.statusCode).toBe(401);
    expect(await userRepository.findOneOrFail({ where: { email } })).toMatchObject({
      password: before.password,
      defaultOrganizationId: workspaceB.id,
    });
  });

  it('should sign in an active member of the workspace', async () => {
    const email = 'member-a@a.example.test';
    await createUser(app, { email, organization: workspaceA, groups: ['end-user'] });

    const response = await signIn(email);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({ email, current_organization_id: workspaceA.id });
  });

  it('should create a new account when sign-up is on', async () => {
    const response = await signIn('brand-new@a.example.test');

    expect(response.statusCode).toBe(201);
    expect(response.body.current_organization_id).toBe(workspaceA.id);
  });
});
