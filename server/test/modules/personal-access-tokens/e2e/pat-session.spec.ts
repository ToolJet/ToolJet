import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  login,
  closeTestApp,
  getDefaultDataSource,
  createCompleteWorkflow,
  ensureAppEnvironments,
  createGroupPermission,
} from 'test-helper';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { User } from '@entities/user.entity';
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
      .send({ name, organizationId: orgId, expiresAt: futureDate(7) });
    // Surface the server's reason — a bare "expected 201, got 403" gives the next person nothing.
    if (res.status !== 201) {
      throw new Error(`createPat expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
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
    await ensureAppEnvironments(app, orgId);
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

    it('should reach a module inside the allowlist', async () => {
      const { token } = await createPat('in-allowlist');
      const { body } = await exchange(token).expect(201);

      await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/tables`)
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(200);

      await request
        .agent(app.getHttpServer())
        .get('/api/organization-users')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });

    it('should create a workflow with a workspace PAT session', async () => {
      const { token } = await createPat('workflow-create');
      const { body } = await exchange(token).expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .send({ name: 'PAT workflow', type: 'workflow' })
        .expect(201);

      expect(res.body).toMatchObject({ id: expect.any(String), name: 'PAT workflow' });
    });

    it('should execute a workflow and read its status and nodes with a workspace PAT session', async () => {
      const user = await getDefaultDataSource().getRepository(User).findOneByOrFail({ id: userId });
      const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
        name: 'PAT execution',
        nodes: [
          {
            id: 'start-1',
            type: 'input',
            data: { nodeType: 'start', label: 'Start trigger' },
            position: { x: 100, y: 250 },
          },
        ],
        edges: [],
        queries: [],
      });
      const { token } = await createPat('workflow-execute');
      const { body } = await exchange(token).expect(201);
      const headers = { Cookie: `tj_auth_token=${body.authToken}`, 'tj-workspace-id': orgId };

      const execution = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set(headers)
        .send({ appId: workflow.id, executeUsing: 'app', userId, environmentId: appVersion.currentEnvironmentId })
        .expect(201);
      expect(execution.body).toMatchObject({ workflowExecution: { id: expect.any(String) } });

      const executionId = execution.body.workflowExecution.id;
      const status = await request(app.getHttpServer())
        .get(`/api/workflow_executions/${executionId}/status`)
        .set(headers)
        .expect(200);
      expect(status.body).toMatchObject({ status: expect.any(Boolean) });

      await request(app.getHttpServer()).get(`/api/workflow_executions/${executionId}/nodes`).set(headers).expect(200);
    });

    it('should create, rename, remove membership and delete custom groups through a PAT session', async () => {
      const { token } = await createPat('dispatch-group-lifecycle');
      const { body } = await exchange(token).expect(201);
      const api = request.agent(app.getHttpServer());
      const headers = { tj_auth_token: body.authToken, 'tj-workspace-id': orgId };
      const base = '/api/v2/group-permissions';
      const created = await api.post(base).set(headers).send({ name: 'Dispatch Roster' }).expect(201);
      const groupId = created.body.id;
      const listed = await api.get(base).set(headers).expect(200);
      expect(listed.body.groupPermissions).toEqual(expect.arrayContaining([expect.objectContaining({ id: groupId })]));
      await api.put(`${base}/${groupId}`).set(headers).send({ name: 'Regional Dispatch' }).expect(200);
      const renamed = await api.get(`${base}/${groupId}`).set(headers).expect(200);
      expect(renamed.body.group.name).toBe('Regional Dispatch');

      // Seed membership using the existing browser endpoint; the MCP adds via organization-users.
      await api.post(`${base}/${groupId}/users`).set('Cookie', tokenCookie).set('tj-workspace-id', orgId)
        .send({ userIds: [userId], groupId }).expect(201);
      const members = await api.get(`${base}/${groupId}/users`).set(headers).expect(200);
      const membership = members.body.find((member) => member.userId === userId);
      expect(membership.id).toBeDefined();
      await api.delete(`${base}/users/${membership.id}`).set(headers).expect(200);
      const afterRemoval = await api.get(`${base}/${groupId}/users`).set(headers).expect(200);
      expect(afterRemoval.body).toEqual([]);
      expect(await getDefaultDataSource().getRepository(OrganizationUser).findOneBy({ userId, organizationId: orgId }))
        .toMatchObject({ status: 'active' });
      await api.delete(`${base}/${groupId}`).set(headers).expect(200);
      const afterDelete = await api.get(base).set(headers).expect(200);
      expect(afterDelete.body.groupPermissions.some((group) => group.id === groupId)).toBe(false);
    });

    it('should preserve default groups and reject group ids in a different workspace', async () => {
      const { token } = await createPat('group-boundaries');
      const { body } = await exchange(token).expect(201);
      const api = request.agent(app.getHttpServer());
      const headers = { tj_auth_token: body.authToken, 'tj-workspace-id': orgId };
      const base = '/api/v2/group-permissions';
      const listed = await api.get(base).set(headers).expect(200);
      const defaultGroup = listed.body.groupPermissions.find((group) => group.type === 'default');
      expect((await api.delete(`${base}/${defaultGroup.id}`).set(headers)).status).toBe(400);
      expect((await api.put(`${base}/${defaultGroup.id}`).set(headers).send({ name: 'Reserved Rename' })).status).toBe(400);
      const outsider = await createUser(app, { email: 'warehouse-admin@example.test' });
      const foreignGroup = await createGroupPermission(app, { name: 'Warehouse Staff', organization: outsider.organization });
      for (const method of ['get', 'put', 'delete'] as const) {
        const res = await api[method](`${base}/${foreignGroup.id}`).set(headers).send({ name: 'Unreachable' });
        expect(res.status).toBe(400);
      }
      await foreignGroup.reload();
      expect(foreignGroup.name).toBe('Warehouse Staff');
    });

    it('should ignore a body workspace override for archive and unarchive', async () => {
      const outsider = await createUser(app, {
        email: 'pat-scope-outsider@tooljet.io',
        firstName: 'other',
        lastName: 'user',
      });
      const { token } = await createPat('workspace-user-pinning');
      const { body } = await exchange(token).expect(201);
      const agent = request.agent(app.getHttpServer());

      const archive = await agent
        .post(`/api/organization-users/${outsider.orgUser.id}/archive`)
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .send({ organizationId: outsider.organization.id });
      expect(archive.status).toBeGreaterThanOrEqual(400);
      await outsider.orgUser.reload();
      expect(outsider.orgUser.status).toBe('active');

      await getDefaultDataSource()
        .getRepository(OrganizationUser)
        .update({ id: outsider.orgUser.id }, { status: 'archived' });
      const unarchive = await agent
        .post(`/api/organization-users/${outsider.orgUser.id}/unarchive`)
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .send({ organizationId: outsider.organization.id });
      expect(unarchive.status).toBeGreaterThanOrEqual(400);
      await outsider.orgUser.reload();
      expect(outsider.orgUser.status).toBe('archived');
    });

    it('should be refused on a module outside the allowlist', async () => {
      const { token } = await createPat('outside-allowlist');
      const { body } = await exchange(token).expect(201);

      // The owner is an admin, so this is denied by the token's ceiling, not by their role —
      // which is the whole point of the allowlist.
      const res = await request
        .agent(app.getHttpServer())
        .get('/api/organizations')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(403);

      expect(res.body.message).toMatch(/personal access token cannot access/i);

      await request
        .agent(app.getHttpServer())
        .post('/api/organization-users/random-id/archive-all')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .expect(403);
    });

    it('should not be able to mint another token', async () => {
      const { token } = await createPat('no-self-propagation');
      const { body } = await exchange(token).expect(201);

      // A token that can create tokens is a persistence mechanism that survives revoking the
      // original, and launders a scoped token into an unscoped one.
      await request
        .agent(app.getHttpServer())
        .post('/api/personal-access-tokens')
        .set('Cookie', `tj_auth_token=${body.authToken}`)
        .set('tj-workspace-id', orgId)
        .send({ name: 'spawned', organizationId: orgId, expiresAt: futureDate(1) })
        .expect(403);
    });

    it('should leave the same endpoints reachable for a normal browser session', async () => {
      // The allowlist must narrow tokens only. A regression here logs every human out of
      // workspace administration.
      await request
        .agent(app.getHttpServer())
        .get('/api/organization-users')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
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
