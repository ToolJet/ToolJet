import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { OrganizationUser } from '@entities/organization_user.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import * as request from 'supertest';
import { getDefaultDataSource } from './bootstrap';

/** Generates a JWT Bearer token string for the given user without any HTTP call. */
export function buildAuthHeader(user: User, organizationId?: string, isPasswordLogin = true): string {
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>('SECRET_KEY_BASE'),
  });
  const authPayload = {
    username: user.id,
    sub: user.email,
    organizationId: organizationId || user.defaultOrganizationId,
    isPasswordLogin,
  };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}

/** Authenticates a user via POST /api/authenticate and returns the user body and session cookie. */
export const authenticateUser = async (
  app: INestApplication,
  email = 'admin@tooljet.io',
  password = 'password',
  organization_id: string | null = null
): Promise<{ user: Record<string, unknown>; tokenCookie: string[] }> => {
  const sessionResponse = await request
    .agent(app.getHttpServer())
    .post(`/api/authenticate${organization_id ? `/${organization_id}` : ''}`)
    .send({ email, password })
    .expect(201);

  return { user: sessionResponse.body, tokenCookie: sessionResponse.headers['set-cookie'] as string[] };
};
/** @deprecated Use authenticateUser instead */
export const loginAs = authenticateUser;

/** Logs out a user via GET /api/session/logout. */
export const logoutUser = async (app: INestApplication, tokenCookie: string[], organization_id: string) => {
  return await request
    .agent(app.getHttpServer())
    .get('/api/session/logout')
    .set('tj-workspace-id', organization_id)
    .set('Cookie', tokenCookie)
    .expect(200);
};
/** @deprecated Use logoutUser instead */
export const logout = logoutUser;

/**
 * Creates a JWT session cookie without calling the login endpoint.
 * Avoids login-flow side effects (workspace creation, event emitter, async handlers)
 * that cause deadlocks and FK violations in tests.
 */
export const buildTestSession = async (
  user: User,
  organizationId?: string
): Promise<{ tokenCookie: string[] }> => {
  const ds = getDefaultDataSource();
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>('SECRET_KEY_BASE'),
  });

  const orgId = organizationId || user.defaultOrganizationId;

  const sessionResult = await ds.query(
    `INSERT INTO user_sessions (user_id, device, created_at, expiry, last_logged_in)
     VALUES ($1, 'test-agent', NOW(), NOW() + INTERVAL '1 day', NOW())
     RETURNING id`,
    [user.id]
  );
  const sessionId = sessionResult[0].id;

  const verify = await ds.query('SELECT id FROM user_sessions WHERE id = $1', [sessionId]);
  if (!verify.length) {
    throw new Error(`buildTestSession: session ${sessionId} not found after INSERT`);
  }

  const payload = {
    sessionId,
    username: user.id,
    sub: user.email,
    organizationIds: [orgId],
    isPasswordLogin: true,
    isSSOLogin: false,
  };

  const token = jwtService.sign(payload);
  const cookie = [`tj_auth_token=${token}; Max-Age=63072000; Path=/; HttpOnly; SameSite=Strict`];

  return { tokenCookie: cookie };
};

/** Verifies an invitation token via the onboarding endpoint and asserts the user becomes 'verified'. */
export const verifyInviteToken = async (app: INestApplication, user: User, verifyForSignup = false) => {
  const organizationUsersRepository: Repository<OrganizationUser> = getDefaultDataSource().getRepository(OrganizationUser);

  const { invitationToken } = user;
  const { invitationToken: orgInviteToken } = await organizationUsersRepository.findOneOrFail({
    where: { userId: user.id },
  });
  const response = await request(app.getHttpServer()).get(
    `/api/onboarding/verify-invite-token?token=${invitationToken}${!verifyForSignup && orgInviteToken ? `&organizationToken=${orgInviteToken}` : ''
    }`
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

/** Sets up an account from an invitation token and asserts the user becomes 'active' in the workspace. */
export const setUpAccountFromToken = async (app: INestApplication, user: User, org: Organization, payload: Record<string, unknown>) => {
  const response = await request(app.getHttpServer()).post('/api/onboarding/setup-account-from-token').send(payload);
  const { status } = response;
  expect(status).toBe(201);

  const { email, first_name, last_name, current_organization_id } = response.body;

  expect(email).toEqual(user.email);
  expect(first_name).toEqual(user.firstName);
  expect(last_name).toEqual(user.lastName);
  expect(current_organization_id).toBe(org.id);
  await user.reload();
  expect(user.status).toBe('active');
  expect(user.defaultOrganizationId).toBe(org.id);
};
