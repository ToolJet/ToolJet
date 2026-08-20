import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, login, closeTestApp, getDefaultDataSource } from 'test-helper';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import * as request from 'supertest';

/**
 * The PAT -> session exchange. A workspace PAT is a durable credential; the session it mints is
 * a disposable wristband. These tests pin the two properties that make that safe: the session is
 * confined to the token's workspace, and killing the token kills the session already in flight.
 *
 * @group platform
 */
describe('Personal access token session exchange', () => {
  let app: INestApplication;
  let tokenCookie: string[];
  let orgId: string;
  let userId: string;

  const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  /** Mints a workspace PAT through the API and returns its raw token + row id. */
  const createPat = async (name: string): Promise<{ token: string; id: string }> => {
    const res = await request
      .agent(app.getHttpServer())
      .post('/api/personal-access-tokens')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .send({ name, organizationId: orgId, expiresAt: futureDate(7) })
      .expect(201);
    return { token: res.body.token, id: res.body.id };
  };

  const exchange = (token: string) =>
    request
      .agent(app.getHttpServer())
      .post('/api/personal-access-tokens/session')
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization, user } = await createUser(app, {
      email: 'admin@tooljet.io',
      firstName: 'user',
      lastName: 'name',
    });
    orgId = organization.id;
    userId = user.id;
    ({ tokenCookie } = await login(app));
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('POST /api/personal-access-tokens/session', () => {
    it('should reject a request with no Authorization header', async () => {
      await request.agent(app.getHttpServer()).post('/api/personal-access-tokens/session').expect(401);
    });

    it('should reject a token that does not exist', async () => {
      await exchange('tj_pat_deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef').expect(401);
    });

    it('should reject a well-formed token sent with the wrong scheme', async () => {
      const { token } = await createPat('wrong-scheme');
      await request
        .agent(app.getHttpServer())
        .post('/api/personal-access-tokens/session')
        .set('Authorization', `Basic ${token}`)
        .expect(401);
    });

    it('should mint a session confined to the token workspace', async () => {
      const { token } = await createPat('mints-session');
      const res = await exchange(token).expect(201);

      expect(res.body.organizationId).toBe(orgId);
      expect(typeof res.body.authToken).toBe('string');

      const payload = JSON.parse(Buffer.from(res.body.authToken.split('.')[1], 'base64').toString());
      expect(payload.isPATLogin).toBe(true);
      // Exactly one workspace, and no appId: this is not the app-scoped embed flow.
      expect(payload.organizationIds).toEqual([orgId]);
      expect(payload.appId).toBeUndefined();
      // Attribution: PAT-driven writes must be distinguishable from a human's in audit logs.
      expect(payload.tj_api_source).toBe('personal_access_token');
    });

    it('should reject an expired token', async () => {
      const { token, id } = await createPat('expired');
      await getDefaultDataSource()
        .getRepository(UserPersonalAccessToken)
        .update({ id }, { expiresAt: new Date(Date.now() - 1000) });

      await exchange(token).expect(401);
    });

    it('should reject a token whose owner is no longer an active member', async () => {
      const { token } = await createPat('membership-withdrawn');
      const orgUsers = getDefaultDataSource().getRepository(OrganizationUser);
      await orgUsers.update({ userId, organizationId: orgId }, { status: 'archived' });

      try {
        // A token must never outlive the membership it was created under.
        await exchange(token).expect(401);
      } finally {
        await orgUsers.update({ userId, organizationId: orgId }, { status: 'active' });
      }
    });
  });

  describe('the minted session against the internal APIs', () => {
    it('should authenticate an internal API call', async () => {
      const { token } = await createPat('authenticates');
      const { body } = await exchange(token).expect(201);

      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });

    it('should authenticate without a tj-workspace-id header', async () => {
      const { token } = await createPat('no-workspace-header');
      const { body } = await exchange(token).expect(201);

      // A PAT session carries exactly one workspace, so the header is redundant for it.
      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .expect(200);
    });

    it('should authenticate when the token is sent as a tj_auth_token header', async () => {
      const { token } = await createPat('header-transport');
      const { body } = await exchange(token).expect(201);

      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('tj_auth_token', body.authToken)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });

    it('should refuse a workspace the token was not minted for', async () => {
      const { organization: other } = await createUser(app, {
        email: 'outsider@tooljet.io',
        firstName: 'other',
        lastName: 'workspace',
      });
      const { token } = await createPat('other-workspace');
      const { body } = await exchange(token).expect(201);

      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', other.id)
        .expect(401);
    });

    it('should die on the next request once the token is revoked', async () => {
      const { token, id } = await createPat('revoked-mid-session');
      const { body } = await exchange(token).expect(201);

      // Sanity: the session works before the revocation.
      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(200);

      await request
        .agent(app.getHttpServer())
        .delete(`/api/personal-access-tokens/${id}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);

      // Deleting the token CASCADE-deletes its user_sessions rows, so the next request finds no
      // session at all. No grace period. This holds under SET NULL too (validateUserSession
      // rejects a PAT session with no token), so the test pins the behaviour, not the mechanism.
      await request
        .agent(app.getHttpServer())
        .get('/api/apps')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(401);
    });

    it('should refuse to re-exchange a revoked token', async () => {
      const { token, id } = await createPat('revoked-then-reused');
      await exchange(token).expect(201);

      await request
        .agent(app.getHttpServer())
        .delete(`/api/personal-access-tokens/${id}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);

      await exchange(token).expect(401);
    });
  });
});
