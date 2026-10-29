/** HTTP and authentication helpers -- login, logout, session management. */
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@entities/user.entity';
import * as request from 'supertest';
import { getDefaultDataSource } from './setup';

/** Authenticates a user via POST /api/authenticate and returns the user body and session cookie. */
export const login = async (
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

/** Logs out a user via GET /api/session/logout. */
export const logout = async (app: INestApplication, tokenCookie: string[], organization_id: string) => {
  return await request
    .agent(app.getHttpServer())
    .get('/api/session/logout')
    .set('tj-workspace-id', organization_id)
    .set('Cookie', tokenCookie)
    .expect(200);
};

/**
 * Creates a JWT session cookie without calling the login endpoint.
 * Avoids login-flow side effects (workspace creation, event emitter, async handlers)
 * that cause deadlocks and FK violations in tests.
 */
export const buildTestSession = async (user: User, organizationId?: string): Promise<{ tokenCookie: string[] }> => {
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

/** Builds the Basic-auth header external API endpoints expect, from EXTERNAL_API_ACCESS_TOKEN. */
export function getExternalApiAuthHeader(app: INestApplication): string {
  return `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
}
