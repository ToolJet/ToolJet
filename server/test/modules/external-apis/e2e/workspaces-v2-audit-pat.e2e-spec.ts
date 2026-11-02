/**
 * @group platform
 */

import * as request from 'supertest';
import { randomBytes } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  initTestApp,
  closeTestApp,
  createUser,
  getDefaultDataSource,
  setTestLicenseTerms,
  restoreLicensePlan,
} from 'test-helper';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { AuditEvent } from '@entities/audit_event.entity';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { hashPat } from '@modules/personal-access-tokens/guards/pat-auth.guard';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';

jest.setTimeout(120_000);

const BASE = '/api/v2/ext/workspaces';

describe('ExternalApisWorkspacesControllerV2 | PAT auth and audit events (EE enterprise)', () => {
  let app: INestApplication;
  let sharedSecret: string;
  let admin: { user: User; workspace: Organization; pat: string };
  let builder: { user: User; workspace: Organization; pat: string };
  let superAdmin: { user: User; workspace: Organization; pat: string };

  const unique = () => `${Date.now()}-${randomBytes(3).toString('hex')}`;

  const createPat = async (user: User, organizationId: string, name: string | null = 'ci-token'): Promise<string> => {
    const raw = `tj_pat_${randomBytes(24).toString('hex')}`;
    await getDefaultDataSource()
      .getRepository(UserPersonalAccessToken)
      .save({
        userId: user.id,
        organizationId,
        name,
        tokenHash: hashPat(raw),
        scope: PersonalAccessTokenScope.WORKSPACE,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    return raw;
  };

  const seedCaller = async (email: string, groups: string[], userType = 'workspace') => {
    const { user, organization } = await createUser(app, { email, groups, userType });
    return { user, workspace: organization, pat: await createPat(user, organization.id) };
  };

  const eventsFor = (res: request.Response) =>
    getDefaultDataSource()
      .getRepository(AuditEvent)
      .find({ where: { requestId: res.headers['x-request-id'] } });

  const withPat = (pat: string) => `Bearer ${pat}`;
  const withSecret = () => `Basic ${sharedSecret}`;

  const setPersonalWorkspaceAllowed = (allowed: boolean) =>
    getDefaultDataSource().query(`UPDATE instance_settings SET value = $1 WHERE key = 'ALLOW_PERSONAL_WORKSPACE'`, [
      String(allowed),
    ]);

  const createWorkspaceWithSecret = async () => {
    const suffix = unique();
    const res = await request(app.getHttpServer())
      .post(BASE)
      .set('Authorization', withSecret())
      .send({ name: `Audit Workspace ${suffix}`, slug: `audit-workspace-${suffix}` })
      .expect(201);
    return res.body as { id: string; name: string; slug: string };
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    sharedSecret = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
    admin = await seedCaller(`pat-admin-${unique()}@tooljet.io`, ['end-user', 'admin']);
    builder = await seedCaller(`pat-builder-${unique()}@tooljet.io`, ['end-user', 'builder']);
    superAdmin = await seedCaller(`pat-super-${unique()}@tooljet.io`, ['end-user', 'admin'], 'instance');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  describe('Authentication', () => {
    it('should reject a PAT that does not exist', async () => {
      await request(app.getHttpServer())
        .get(BASE)
        .set('Authorization', withPat(`tj_pat_${'0'.repeat(48)}`))
        .expect(401);
    });

    it('should reject an expired PAT', async () => {
      const pat = await createPat(admin.user, admin.workspace.id, 'expired');
      await getDefaultDataSource()
        .getRepository(UserPersonalAccessToken)
        .update({ tokenHash: hashPat(pat) }, { expiresAt: new Date(Date.now() - 1000) });

      await request(app.getHttpServer()).get(BASE).set('Authorization', withPat(pat)).expect(401);
    });

    it('should still reject a missing or wrong shared secret with 403, as before', async () => {
      await request(app.getHttpServer()).get(BASE).expect(403);
      await request(app.getHttpServer()).get(BASE).set('Authorization', 'Basic wrong-token').expect(403);
    });
  });

  describe('Shared secret (api_key)', () => {
    it('should create a workspace and record it with an api_key actor', async () => {
      const suffix = unique();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', withSecret())
        .send({ name: `Secret Workspace ${suffix}`, slug: `secret-workspace-${suffix}` })
        .expect(201);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({
          action: 'workspace.created',
          outcome: 'success',
          workspaceId: res.body.id,
          actorType: 'api_key',
          actor: expect.objectContaining({ type: 'api_key', user: null, token: null }),
          target: { type: 'workspace', id: res.body.id, display_name: `secret-workspace-${suffix}`, parent: null },
          changes: {
            name: { from: null, to: `Secret Workspace ${suffix}` },
            slug: { from: null, to: `secret-workspace-${suffix}` },
            status: { from: null, to: 'active' },
            default: { from: null, to: false },
          },
        }),
      ]);
    });

    it('should write no event when the request fails', async () => {
      const existing = await createWorkspaceWithSecret();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', withSecret())
        .send({ name: existing.name, slug: `other-${unique()}` })
        .expect(409);

      expect(await eventsFor(res)).toEqual([]);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier | workspace admin PAT', () => {
    it('should rename their own workspace and record only the changed field', async () => {
      const newName = `Renamed ${unique()}`;
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${admin.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .send({ name: newName })
        .expect(200);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({
          action: 'workspace.updated',
          outcome: 'success',
          workspaceId: admin.workspace.id,
          actorType: 'pat',
          actorUserId: admin.user.id,
          actor: expect.objectContaining({
            type: 'pat',
            user: expect.objectContaining({ id: admin.user.id, email: admin.user.email }),
            token: expect.objectContaining({ name: 'ci-token' }),
          }),
          changes: { name: { from: admin.workspace.name, to: newName } },
        }),
      ]);
    });

    it('should write no event for a PATCH that changes nothing', async () => {
      const name = `Unchanged ${unique()}`;
      const rename = () =>
        request(app.getHttpServer())
          .patch(`${BASE}/${admin.workspace.id}`)
          .set('Authorization', withPat(admin.pat))
          .send({ name })
          .expect(200);
      await rename();
      const res = await rename();

      expect(await eventsFor(res)).toEqual([]);
    });

    it('should deny changing the status, which needs a super admin, and record one denied event', async () => {
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${admin.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .send({ status: 'archived' })
        .expect(403);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({
          action: 'workspace.updated',
          outcome: 'denied',
          workspaceId: admin.workspace.id,
          actorUserId: admin.user.id,
          changes: null,
        }),
      ]);
    });

    it('should deny editing a workspace other than the token workspace', async () => {
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${builder.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .send({ name: `Hijack ${unique()}` })
        .expect(403);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({ action: 'workspace.updated', outcome: 'denied', workspaceId: builder.workspace.id }),
      ]);
    });

    it('should label a PAT that has no name', async () => {
      const unnamedPat = await createPat(admin.user, admin.workspace.id, null);
      const newName = `Unnamed Token Rename ${unique()}`;
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${admin.workspace.id}`)
        .set('Authorization', withPat(unnamedPat))
        .send({ name: newName })
        .expect(200);

      const [event] = await eventsFor(res);
      expect(event.actor).toMatchObject({ type: 'pat', token: { name: 'api_key' } });
    });
  });

  describe('GET /api/v2/ext/workspaces | non-super-admin PAT', () => {
    it('should list only the workspaces the caller belongs to', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}?per_page=100`)
        .set('Authorization', withPat(admin.pat))
        .expect(200);

      const ids = res.body.data.map((workspace: { id: string }) => workspace.id);
      expect(ids).toContain(admin.workspace.id);
      expect(ids).not.toContain(builder.workspace.id);
    });

    it('should hide a workspace the caller is not a member of', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/${builder.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .expect(404);
    });

    it('should not record reads', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/${admin.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .expect(200);

      expect(await eventsFor(res)).toEqual([]);
    });
  });

  describe('Archive, unarchive and set-default | super admin PAT', () => {
    it('should let a super admin list every workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}?search=${encodeURIComponent(builder.workspace.name)}`)
        .set('Authorization', withPat(superAdmin.pat))
        .expect(200);

      expect(res.body.data.map((workspace: { id: string }) => workspace.id)).toContain(builder.workspace.id);
    });

    it('should record status and default changes made through PATCH as workspace.updated', async () => {
      const workspace = await createWorkspaceWithSecret();
      const patch = (body: Record<string, unknown>) =>
        request(app.getHttpServer())
          .patch(`${BASE}/${workspace.id}`)
          .set('Authorization', withPat(superAdmin.pat))
          .send(body)
          .expect(200);

      const archived = await patch({ status: 'archived' });
      expect(await eventsFor(archived)).toEqual([
        expect.objectContaining({
          action: 'workspace.updated',
          workspaceId: workspace.id,
          changes: { status: { from: 'active', to: 'archived' } },
        }),
      ]);

      await patch({ status: 'active' });
      const defaulted = await patch({ default: true });
      expect(await eventsFor(defaulted)).toEqual([
        expect.objectContaining({
          action: 'workspace.updated',
          workspaceId: workspace.id,
          changes: { default: { from: false, to: true } },
        }),
      ]);
    });

    it('should record archive, unarchive and set-default as separate events', async () => {
      const workspace = await createWorkspaceWithSecret();
      const call = (path: string) =>
        request(app.getHttpServer())
          .post(`${BASE}/${workspace.id}/${path}`)
          .set('Authorization', withPat(superAdmin.pat))
          .expect(200);

      const archived = await call('archive');
      expect(await eventsFor(archived)).toEqual([
        expect.objectContaining({
          action: 'workspace.archived',
          actorUserId: superAdmin.user.id,
          changes: { status: { from: 'active', to: 'archived' } },
        }),
      ]);

      const unarchived = await call('unarchive');
      expect(await eventsFor(unarchived)).toEqual([
        expect.objectContaining({
          action: 'workspace.unarchived',
          changes: { status: { from: 'archived', to: 'active' } },
        }),
      ]);

      const defaulted = await call('set-default');
      expect(await eventsFor(defaulted)).toEqual([
        expect.objectContaining({
          action: 'workspace.default_set',
          workspaceId: workspace.id,
          changes: { default: { from: false, to: true } },
        }),
      ]);
    });

    it('should record nothing when PATCH sets default on the current default', async () => {
      const workspace = await createWorkspaceWithSecret();
      await request(app.getHttpServer())
        .post(`${BASE}/${workspace.id}/set-default`)
        .set('Authorization', withPat(superAdmin.pat))
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${workspace.id}`)
        .set('Authorization', withPat(superAdmin.pat))
        .send({ default: true })
        .expect(200);
      expect(await eventsFor(res)).toEqual([]);
    });

    it('should deny a workspace admin archiving a workspace and record one denied event', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/${admin.workspace.id}/archive`)
        .set('Authorization', withPat(admin.pat))
        .expect(403);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({ action: 'workspace.archived', outcome: 'denied', workspaceId: admin.workspace.id }),
      ]);
    });
  });

  describe('POST /api/v2/ext/workspaces | builder PAT', () => {
    afterEach(() => setPersonalWorkspaceAllowed(true));

    it('should let a builder create a workspace when personal workspaces are allowed', async () => {
      await setPersonalWorkspaceAllowed(true);
      const suffix = unique();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', withPat(builder.pat))
        .send({ name: `Builder Workspace ${suffix}`, slug: `builder-workspace-${suffix}` })
        .expect(201);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({ action: 'workspace.created', actorUserId: builder.user.id }),
      ]);
    });

    it('should make the creator an admin of the new workspace, as the dashboard does', async () => {
      await setPersonalWorkspaceAllowed(true);
      const suffix = unique();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', withPat(builder.pat))
        .send({ name: `Owned Workspace ${suffix}`, slug: `owned-workspace-${suffix}` })
        .expect(201);

      const listed = await request(app.getHttpServer())
        .get(`${BASE}?search=owned-workspace-${suffix}`)
        .set('Authorization', withPat(builder.pat))
        .expect(200);
      expect(listed.body.data.map((workspace: { id: string }) => workspace.id)).toEqual([res.body.id]);

      const adminGroup = await getDefaultDataSource().query(
        `SELECT gp.name FROM group_users gu JOIN permission_groups gp ON gp.id = gu.group_id
         WHERE gu.user_id = $1 AND gp.organization_id = $2 AND gp.name = 'admin'`,
        [builder.user.id, res.body.id]
      );
      expect(adminGroup).toHaveLength(1);
    });

    it('should not also write a legacy audit log entry', async () => {
      await setPersonalWorkspaceAllowed(true);
      const emit = jest.spyOn(app.get(EventEmitter2), 'emit');
      try {
        const suffix = unique();
        await request(app.getHttpServer())
          .post(BASE)
          .set('Authorization', withPat(builder.pat))
          .send({ name: `No Legacy ${suffix}`, slug: `no-legacy-${suffix}` })
          .expect(201);
        expect(emit).not.toHaveBeenCalledWith('auditLogEntry', expect.anything());
      } finally {
        emit.mockRestore();
      }
    });

    it('should deny a builder creating a workspace when personal workspaces are disabled', async () => {
      await setPersonalWorkspaceAllowed(false);
      const suffix = unique();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', withPat(builder.pat))
        .send({ name: `Blocked Workspace ${suffix}`, slug: `blocked-workspace-${suffix}` })
        .expect(403);

      expect(await eventsFor(res)).toEqual([
        expect.objectContaining({
          action: 'workspace.created',
          outcome: 'denied',
          targetId: null,
          target: expect.objectContaining({ display_name: `blocked-workspace-${suffix}` }),
          workspaceId: builder.workspace.id,
        }),
      ]);
    });
  });

  describe('Request correlation and licensing', () => {
    it('should return the request id that the event carries', async () => {
      const newName = `Correlated ${unique()}`;
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${admin.workspace.id}`)
        .set('Authorization', withPat(admin.pat))
        .send({ name: newName })
        .expect(200);

      expect(res.headers['x-request-id']).toEqual(expect.any(String));
      expect(await eventsFor(res)).toHaveLength(1);
    });

    it('should record nothing when the plan does not include audit logs', async () => {
      setTestLicenseTerms(app, { features: { externalApi: true, auditLogs: false } } as never);
      try {
        const newName = `Unlicensed ${unique()}`;
        const res = await request(app.getHttpServer())
          .patch(`${BASE}/${admin.workspace.id}`)
          .set('Authorization', withPat(admin.pat))
          .send({ name: newName })
          .expect(200);

        expect(await eventsFor(res)).toEqual([]);
      } finally {
        restoreLicensePlan(app);
      }
    });
  });
});
