import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  buildTestSession,
  getDefaultDataSource,
  withRealTransactions,
} from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';
const NEW_CYCLE = '2026-10-15T09:00:00.000Z';
const ADDON_END = '2026-10-20T00:00:00.000Z';

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

interface Wallets {
  /** Plan sizes (wallet total_amount). */
  plan: { monthly: number; addon: number };
  /** Remaining now; nothing spent this cycle, so this is also the cycle-start pool. */
  remaining: { monthly: number; addon: number };
  cycleStart?: string;
  addonEndsAt?: string | null;
}

function gatewayFor(ownerPath: string, w: Wallets) {
  const cycleStart = w.cycleStart ?? CYCLE_START;
  const usage = { cycleStart, trackingSince: null, users: [], unattributed: wallet(0), pool: wallet(0) };
  return {
    [`${ownerPath}/balance`]: {
      plan: wallet(w.plan.monthly, w.plan.addon),
      remaining: wallet(w.remaining.monthly, w.remaining.addon),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: w.addonEndsAt ?? null },
      cycleStart,
    },
    [`${ownerPath}/usage`]: usage,
    [`${ownerPath}/usage?groupBy=organization`]: usage,
  };
}

const full = (monthly: number, addon = 0, extra: Partial<Wallets> = {}): Wallets => ({
  plan: { monthly, addon },
  remaining: { monthly, addon },
  ...extra,
});

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

const getUsage = (app: INestApplication, cookie: string[], organizationId: string) =>
  request(app.getHttpServer())
    .get('/api/ai/credits-usage')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie);

const putBuilderLimit = (
  app: INestApplication,
  cookie: string[],
  organizationId: string,
  userId: string,
  body: object
) =>
  request(app.getHttpServer())
    .put(`/api/ai/credits-usage/limits/builders/${userId}`)
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie)
    .send(body);

const putLimits = (app: INestApplication, cookie: string[], organizationId: string, body: object) =>
  request(app.getHttpServer())
    .put('/api/ai/credits-usage/limits')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie)
    .send(body);

const customRows = (userId: string) =>
  getDefaultDataSource().query(`SELECT pool, value FROM ai_credit_limits WHERE user_id = $1 ORDER BY pool`, [userId]);

/** Written by an async listener; wait, then give stragglers a moment so counts are final. */
async function adjustedAudit(organizationId: string, expected: number) {
  const read = () =>
    getDefaultDataSource().query(
      `SELECT user_id AS "userId", metadata FROM audit_logs
        WHERE organization_id = $1 AND action_type = 'AI_CREDIT_LIMITS_ADJUSTED' ORDER BY created_at`,
      [organizationId]
    );
  for (let i = 0; i < 50 && (await read()).length < expected; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 300));
  return read();
}

/** Committed seed (outside the suite transaction) has to be deleted by hand. */
async function dropSeed(organizationId: string, userIds: string[]) {
  const db = getDefaultDataSource();
  for (const table of ['ai_credit_limits', 'audit_logs', 'data_sources']) {
    await db.query(`DELETE FROM ${table} WHERE organization_id = $1`, [organizationId]);
  }
  await db.query('DELETE FROM ai_credit_limits WHERE user_id = ANY($1)', [userIds]);
  await db.query('DELETE FROM organizations WHERE id = $1', [organizationId]);
  await db.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
}

/** @group ai */
describe('AI credit limits: pool changes', () => {
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

    /** Admin + 3 builders = 4 builders. Builder 1 gets a custom monthly limit of 3,000 on a 10,000 pool. */
    async function seedWithCustom(prefix: string, wallets: Wallets = full(10_000)) {
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
      const cookie = await sessionFor(admin.user, workspace.id);
      const owner = `/api/ai/organizations/${workspace.id}`;
      licenseWith(app, { aiPlan: 'credits' });
      const gateway = stubGateway(gatewayFor(owner, wallets));
      expect((await putLimits(app, cookie, workspace.id, { enabled: true })).statusCode).toBe(200);
      expect(
        (await putBuilderLimit(app, cookie, workspace.id, builders[0].user.id, { monthly: 3000 })).statusCode
      ).toBe(200);
      gateway.mockRestore();
      return { admin, workspace, builders, cookie, owner, userIds: [admin, ...builders].map((u) => u.user.id) };
    }

    it('AC1: a plan change that makes the max 2,000 turns a 3,000 custom limit into the default, audited by the system', async () => {
      const s = await seedWithCustom('pc1');
      // 4 builders on 2,003: builder 1 may hold 2,003 − 3 = 2,000.
      stubGateway(gatewayFor(s.owner, full(2003, 0, { cycleStart: NEW_CYCLE })));

      const res = await getUsage(app, s.cookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(await customRows(s.builders[0].user.id)).toEqual([]);
      const row = res.body.rows.find((r) => r.userId === s.builders[0].user.id);
      expect(row.customLimit).toBeUndefined();
      expect(row.limit.monthly).toBe(500);
      const [entry, ...rest] = await adjustedAudit(s.workspace.id, 1);
      expect(rest).toEqual([]);
      expect(entry.userId).toBeNull();
      expect(entry.metadata).toMatchObject({
        reason: 'plan_change',
        defaultBefore: 2333,
        defaultAfter: 500,
        customReduced: 1,
        builders: [{ builderId: s.builders[0].user.id, pool: 'monthly', before: 3000, after: null }],
      });
    });

    it('AC2: a plan change shows a notice on every read until replaced', async () => {
      const s = await seedWithCustom('pc2');
      stubGateway(gatewayFor(s.owner, full(2003, 0, { cycleStart: NEW_CYCLE })));

      const first = await getUsage(app, s.cookie, s.workspace.id);
      const second = await getUsage(app, s.cookie, s.workspace.id);

      const notice = { kind: 'plan_change', on: NEW_CYCLE, defaultBefore: 2333, defaultAfter: 500, reduced: 1 };
      expect(first.body.notices).toEqual([notice]);
      expect(second.body.notices).toEqual([notice]);
      expect(await adjustedAudit(s.workspace.id, 1)).toHaveLength(1);
    });

    it('AC2: a renewal with overdraft carry-in changes nothing and shows no notice', async () => {
      const s = await seedWithCustom('pc3');
      // Same plan; 9,000 overdraft carried in, so the new cycle starts with 1,000.
      stubGateway(
        gatewayFor(s.owner, { plan: { monthly: 10_000, addon: 0 }, remaining: { monthly: 1000, addon: 0 }, cycleStart: NEW_CYCLE })
      );

      const res = await getUsage(app, s.cookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.notices).toEqual([]);
      expect(await customRows(s.builders[0].user.id)).toEqual([{ pool: 'monthly', value: 3000 }]);
      expect(await adjustedAudit(s.workspace.id, 0)).toEqual([]);
    });

    it('AC3: an add-on expiry reduces add-on limits only, dated by the expiry', async () => {
      const s = await seedWithCustom('pc4', full(10_000, 2000, { addonEndsAt: ADDON_END }));
      stubGateway(gatewayFor(s.owner, full(10_000, 2000, { addonEndsAt: ADDON_END })));
      expect(
        (await putBuilderLimit(app, s.cookie, s.workspace.id, s.builders[0].user.id, { monthly: 3000, addon: 1500 }))
          .statusCode
      ).toBe(200);
      jest.restoreAllMocks();
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, full(10_000, 0)));

      const res = await getUsage(app, s.cookie, s.workspace.id);

      expect(await customRows(s.builders[0].user.id)).toEqual([{ pool: 'monthly', value: 3000 }]);
      expect(res.body.notices).toEqual([
        { kind: 'addon_expiry', on: ADDON_END, defaultBefore: 166, defaultAfter: 0, reduced: 1 },
      ]);
    });

    it('a save after a shrink sees the adjusted limits first', async () => {
      const s = await seedWithCustom('pc5');
      stubGateway(gatewayFor(s.owner, full(2003, 0, { cycleStart: NEW_CYCLE })));

      // Without the adjustment builder 1's stale 3,000 would make any custom default over the max.
      const res = await putLimits(app, s.cookie, s.workspace.id, {
        defaults: { monthly: { mode: 'custom', value: 500 }, addon: { mode: 'equal_share' } },
      });

      expect(res.statusCode).toBe(200);
      expect(await customRows(s.builders[0].user.id)).toEqual([]);
      expect(await adjustedAudit(s.workspace.id, 1)).toHaveLength(1);
    });

    // Real transactions: inside the suite transaction every request shares one session and the lock never blocks.
    it('two reads detecting the same shrink adjust once and log once', async () => {
      await withRealTransactions(async () => {
        const s = await seedWithCustom(`pc6${uuidv4().slice(0, 6)}`);
        try {
          stubGateway(gatewayFor(s.owner, full(2003, 0, { cycleStart: NEW_CYCLE })));

          const results = await Promise.all([
            getUsage(app, s.cookie, s.workspace.id),
            getUsage(app, s.cookie, s.workspace.id),
            getUsage(app, s.cookie, s.workspace.id),
          ]);

          expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200]);
          expect(await customRows(s.builders[0].user.id)).toEqual([]);
          expect(await adjustedAudit(s.workspace.id, 1)).toHaveLength(1);
        } finally {
          await dropSeed(s.workspace.id, s.userIds);
        }
      });
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s11';
    const owner = `/api/ai/selfhost-customers/${customerId}`;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('a plan change adjusts the instance-wide limits; the audit entry is instance-level', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh11-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const builder = await createUser(app, {
        email: 'sh11-builder@tooljet.io',
        groups: ['end-user', 'builder'],
        organization: superAdmin.organization,
      });
      licenseWith(app, { aiPlan: 'credits', aiEnabled: true, ai: { apiKey: 'selfhost-key' }, metadata: { customerId } });
      const gateway = stubGateway(gatewayFor(owner, full(10_000)));
      const cookie = await sessionFor(superAdmin.user, superAdmin.organization.id);
      expect(
        (await putBuilderLimit(app, cookie, superAdmin.organization.id, builder.user.id, { monthly: 3000 })).statusCode
      ).toBe(200);
      gateway.mockRestore();
      stubGateway(gatewayFor(owner, full(1000, 0, { cycleStart: NEW_CYCLE })));

      const res = await getUsage(app, cookie, superAdmin.organization.id);

      expect(res.body.notices).toEqual([
        { kind: 'plan_change', on: NEW_CYCLE, defaultBefore: 7000, defaultAfter: 500, reduced: 1 },
      ]);
      expect(await customRows(builder.user.id)).toEqual([]);
      const [entry] = await adjustedAudit(superAdmin.organization.id, 1);
      expect(entry.metadata).toMatchObject({ instance_level: true, reason: 'plan_change' });
    });
  });
});
