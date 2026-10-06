import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createUser, buildTestSession, getDefaultDataSource } from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';

/** Stubs fetch at the gateway HTTP boundary; every other URL goes to the real fetch. */
function stubGateway(routes: Record<string, unknown>) {
  const realFetch = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (!url.startsWith(GATEWAY)) return realFetch(input, init);
    const path = url.slice(GATEWAY.length);
    if (!(path in routes)) return new Response(JSON.stringify({ message: 'not stubbed' }), { status: 404 });
    return new Response(JSON.stringify(routes[path]), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}

function licenseWith(app: INestApplication, overrides: Record<string, unknown>) {
  const lts = app.get(LicenseTermsService);
  const original = lts.getLicenseTerms.bind(lts);
  jest.spyOn(lts, 'getLicenseTerms').mockImplementation(async (fields: unknown, organizationId?: string) => {
    const base = await original(fields, organizationId);
    if (Array.isArray(fields)) {
      const merged = { ...(base as Record<string, unknown>) };
      for (const f of fields) if (f in overrides) merged[f] = overrides[f];
      return merged;
    }
    return typeof fields === 'string' && fields in overrides ? overrides[fields] : base;
  });
}

const wallet = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

/** Gateway stubs for one owner: pool sizes are remaining + spend, so remaining = pool − Σ spend. */
function gatewayFor(ownerPath: string, pool: { monthly: number; addon: number }, spend: Record<string, number> = {}) {
  const users = Object.entries(spend).map(([userId, monthly]) => ({ userId, ...wallet(monthly) }));
  const used = users.reduce((acc, u) => acc + u.recurring, 0);
  return {
    [`${ownerPath}/balance`]: {
      remaining: wallet(pool.monthly - used, pool.addon),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: null },
      cycleStart: CYCLE_START,
    },
    [`${ownerPath}/usage`]: { cycleStart: CYCLE_START, trackingSince: null, users, unattributed: wallet(0), pool: wallet(used) },
    [`${ownerPath}/usage?groupBy=organization`]: {
      cycleStart: CYCLE_START,
      trackingSince: null,
      users: users.map((u) => ({ ...u, byOrganization: [] })),
      unattributed: wallet(0),
      pool: wallet(used),
    },
  };
}

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

const getUsage = (app: INestApplication, cookie: string[], organizationId: string) =>
  request(app.getHttpServer()).get('/api/ai/credits-usage').set('tj-workspace-id', organizationId).set('Cookie', cookie);

const putLimits = (app: INestApplication, cookie: string[], organizationId: string, body: object) =>
  request(app.getHttpServer())
    .put('/api/ai/credits-usage/limits')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie)
    .send(body);

const limitRows = (organizationId: string | null) =>
  getDefaultDataSource().query(
    `SELECT pool, mode, value, enabled FROM ai_credit_limits
      WHERE organization_id IS NOT DISTINCT FROM $1::uuid AND user_id IS NULL ORDER BY pool`,
    [organizationId]
  );

/** Both pool rows carry one flag; it must never diverge. */
async function expectOneFlag(organizationId: string | null) {
  const flags = new Set((await limitRows(organizationId)).map((r) => r.enabled));
  expect(flags.size).toBeLessThanOrEqual(1);
}

/** Audit entries are written by an async listener; wait for them. */
async function auditActions(organizationId: string, expected: number) {
  for (let i = 0; i < 50; i++) {
    const rows = await getDefaultDataSource().query(
      `SELECT action_type AS "actionType", metadata FROM audit_logs
        WHERE organization_id = $1 AND action_type LIKE 'AI_CREDIT_LIMIT%' ORDER BY created_at, action_type`,
      [organizationId]
    );
    if (rows.length >= expected) return rows;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('audit entries not written');
}

const customMonthly = (value: number) => ({
  monthly: { mode: 'custom', value },
  addon: { mode: 'equal_share' },
});

/** @group ai */
describe('AI credit limits', () => {
  const previousGateway = process.env.TJ_AI_GATEWAY_URL;

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
  });

  afterAll(() => {
    process.env.TJ_AI_GATEWAY_URL = previousGateway;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cloud', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'cloud', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'cloud';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Admin + 3 builders = 4 builders; monthly pool 1,000 gives an equal share of 250. */
    async function seed(prefix: string) {
      const admin = await createUser(app, { email: `${prefix}-admin@tooljet.io`, groups: ['end-user', 'admin'] });
      const workspace = admin.organization;
      const builders = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          await createUser(app, {
            email: `${prefix}-b${n}@tooljet.io`,
            groups: ['end-user', 'builder'],
            organization: workspace,
          })
        );
      }
      const endUser = await createUser(app, {
        email: `${prefix}-end@tooljet.io`,
        groups: ['end-user'],
        organization: workspace,
      });
      const cookie = await sessionFor(admin.user, workspace.id);
      return { admin, workspace, builders, endUser, cookie, owner: `/api/ai/organizations/${workspace.id}` };
    }

    const POOL = { monthly: 1000, addon: 100 };

    it('AC7: a scope before any admin action has limits off and no rows', async () => {
      const s = await seed('ac7');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));

      const res = await getUsage(app, s.cookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.limits).toMatchObject({
        enabled: false,
        builderCount: 4,
        customCount: 0,
        monthly: { mode: 'equal_share', value: null, max: 250, effective: 250 },
        addon: { mode: 'equal_share', value: null, max: 25, effective: 25 },
      });
      expect(await limitRows(s.workspace.id)).toEqual([]);
      const builderRow = res.body.rows.find((r) => r.userId === s.builders[0].user.id);
      expect(builderRow.limit).toEqual({ monthly: 250, addon: 25 });
    });

    it('AC2: a custom default reduces when a builder joins and returns when they leave', async () => {
      const s = await seed('ac2');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));
      expect((await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(250) })).statusCode).toBe(200);

      const joiner = await createUser(app, {
        email: 'ac2-joiner@tooljet.io',
        groups: ['end-user', 'builder'],
        organization: s.workspace,
      });
      const joined = (await getUsage(app, s.cookie, s.workspace.id)).body.limits;
      expect(joined.monthly).toMatchObject({ mode: 'custom', value: 250, effective: 200, note: 'reduced' });
      expect(joined.monthly.effective * joined.builderCount).toBeLessThanOrEqual(POOL.monthly);

      await getDefaultDataSource().query(`UPDATE organization_users SET status = 'archived' WHERE user_id = $1`, [
        joiner.user.id,
      ]);
      const left = (await getUsage(app, s.cookie, s.workspace.id)).body.limits;
      expect(left.monthly).toMatchObject({ value: 250, effective: 250, note: null });
    });

    it('AC3: a custom default over the max is a 400 and nothing persists', async () => {
      const s = await seed('ac3');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));

      const res = await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(251) });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Cannot allocate more than 250 per builder');
      expect(await limitRows(s.workspace.id)).toEqual([]);
    });

    it.each([[{ enabled: true, defaults: customMonthly(0) }], [{ enabled: true, defaults: customMonthly(1.5) }], [{}]])(
      'AC3: an invalid body %o is a 400',
      async (body) => {
        const s = await seed(`ac3v${uuidv4().slice(0, 6)}`);
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));

        expect((await putLimits(app, s.cookie, s.workspace.id, body)).statusCode).toBe(400);
        expect(await limitRows(s.workspace.id)).toEqual([]);
      }
    );

    it('AC3: two admins saving at once leave every limit within the pool', async () => {
      const s = await seed('ac3c');
      const second = await createUser(app, {
        email: 'ac3c-admin2@tooljet.io',
        groups: ['end-user', 'admin'],
        organization: s.workspace,
      });
      // 5 builders now: max 200.
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));
      const secondCookie = await sessionFor(second.user, s.workspace.id);

      const results = await Promise.all([
        putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(200) }),
        putLimits(app, secondCookie, s.workspace.id, { enabled: true, defaults: customMonthly(150) }),
      ]);

      expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
      expect(await limitRows(s.workspace.id)).toHaveLength(2);
      await expectOneFlag(s.workspace.id);
      const limits = (await getUsage(app, s.cookie, s.workspace.id)).body.limits;
      expect(limits.monthly.effective * limits.builderCount).toBeLessThanOrEqual(POOL.monthly);
    });

    it('AC4: a builder or end user gets 403 on save and toggle', async () => {
      const s = await seed('ac4');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));

      for (const who of [s.builders[0], s.endUser]) {
        const cookie = await sessionFor(who.user, s.workspace.id);
        expect((await putLimits(app, cookie, s.workspace.id, { enabled: true })).statusCode).toBe(403);
        expect(
          (await putLimits(app, cookie, s.workspace.id, { enabled: true, defaults: customMonthly(10) })).statusCode
        ).toBe(403);
      }
      expect(await limitRows(s.workspace.id)).toEqual([]);
    });

    it('AC5: turning on with new values logs ENABLED with the count over and UPDATED; turning off logs DISABLED', async () => {
      const s = await seed('ac5');
      licenseWith(app, { aiPlan: 'credits' });
      // Limit 100 + add-on 25; two builders already used 200.
      stubGateway(
        gatewayFor(s.owner, POOL, { [s.builders[0].user.id]: 200, [s.builders[1].user.id]: 200, [s.admin.user.id]: 5 })
      );

      const on = await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(100) });
      expect(on.statusCode).toBe(200);
      const afterOn = await auditActions(s.workspace.id, 2);
      expect(afterOn).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ actionType: 'AI_CREDIT_LIMIT_ENABLED', metadata: { buildersOverLimit: 2 } }),
          expect.objectContaining({
            actionType: 'AI_CREDIT_LIMIT_UPDATED',
            metadata: {
              before: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
              after: customMonthly(100),
            },
          }),
        ])
      );

      expect((await putLimits(app, s.cookie, s.workspace.id, { enabled: false })).statusCode).toBe(200);
      const afterOff = await auditActions(s.workspace.id, 3);
      expect(afterOff.map((r) => r.actionType)).toContain('AI_CREDIT_LIMIT_DISABLED');
      await expectOneFlag(s.workspace.id);
    });

    it('AC6: turning limits off then on keeps the defaults', async () => {
      const s = await seed('ac6');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));

      await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(120) });
      await putLimits(app, s.cookie, s.workspace.id, { enabled: false });
      await expectOneFlag(s.workspace.id);
      expect((await getUsage(app, s.cookie, s.workspace.id)).body.limits).toMatchObject({
        enabled: false,
        monthly: { mode: 'custom', value: 120 },
      });

      await putLimits(app, s.cookie, s.workspace.id, { enabled: true });
      await expectOneFlag(s.workspace.id);
      const limits = (await getUsage(app, s.cookie, s.workspace.id)).body.limits;
      expect(limits).toMatchObject({
        enabled: true,
        monthly: { mode: 'custom', value: 120, effective: 120 },
        addon: { mode: 'equal_share' },
      });
    });

    it("scopes are separate: workspace A's save never touches workspace B", async () => {
      const a = await seed('scopea');
      const b = await seed('scopeb');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway({ ...gatewayFor(a.owner, POOL), ...gatewayFor(b.owner, POOL) });

      await putLimits(app, a.cookie, a.workspace.id, { enabled: true });

      expect(await limitRows(a.workspace.id)).toHaveLength(2);
      expect(await limitRows(b.workspace.id)).toEqual([]);
      expect((await getUsage(app, b.cookie, b.workspace.id)).body.limits.enabled).toBe(false);
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s6';
    const owner = `/api/ai/selfhost-customers/${customerId}`;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    const selfhostLicense = () =>
      licenseWith(app, { aiPlan: 'credits', aiEnabled: true, ai: { apiKey: 'selfhost-key' }, metadata: { customerId } });

    it('super admin saves one instance-wide default (no workspace on the rows)', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh6-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      await createUser(app, { email: 'sh6-other@tooljet.io', groups: ['end-user', 'admin'], organizationName: 'Other' });
      selfhostLicense();
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));
      const cookie = await sessionFor(superAdmin.user, superAdmin.organization.id);

      const res = await putLimits(app, cookie, superAdmin.organization.id, { enabled: true });

      expect(res.statusCode).toBe(200);
      expect(await limitRows(null)).toHaveLength(2);
      expect(await limitRows(superAdmin.organization.id)).toEqual([]);
      const limits = (await getUsage(app, cookie, superAdmin.organization.id)).body.limits;
      expect(limits).toMatchObject({ enabled: true, builderCount: 2, monthly: { effective: 500 } });
    });

    it('AC4: a workspace admin who is not a super admin gets 403', async () => {
      const admin = await createUser(app, { email: 'sh6-ws-admin@tooljet.io', groups: ['end-user', 'admin'] });
      selfhostLicense();
      stubGateway({});

      const res = await putLimits(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id, {
        enabled: true,
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('CE', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      process.env.TOOLJET_EDITION = 'ce';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('saving limits returns 404', async () => {
      const admin = await createUser(app, { email: 'ce6-admin@tooljet.io', groups: ['end-user', 'admin'] });

      const res = await putLimits(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id, {
        enabled: true,
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
