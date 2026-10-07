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
    [`${ownerPath}/usage`]: {
      cycleStart: CYCLE_START,
      trackingSince: null,
      users,
      unattributed: wallet(0),
      pool: wallet(used),
    },
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
  request(app.getHttpServer())
    .get('/api/ai/credits-usage')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie);

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

/** Committed seed (outside the suite transaction) has to be deleted by hand. */
async function dropSeed(organizationId: string, userIds: string[]) {
  const db = getDefaultDataSource();
  for (const table of ['ai_credit_limits', 'audit_logs', 'data_sources']) {
    await db.query(`DELETE FROM ${table} WHERE organization_id = $1`, [organizationId]);
  }
  await db.query('DELETE FROM organizations WHERE id = $1', [organizationId]);
  await db.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
}

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

const builderRows = (userId: string) =>
  getDefaultDataSource().query(
    `SELECT organization_id AS "organizationId", pool, value FROM ai_credit_limits WHERE user_id = $1 ORDER BY pool`,
    [userId]
  );

/** Builder-limit audit entries; written by an async listener, so wait for them. */
async function builderAudit(organizationId: string, expected: number) {
  for (let i = 0; i < 50; i++) {
    const rows = await getDefaultDataSource().query(
      `SELECT user_id AS "userId", metadata FROM audit_logs
        WHERE organization_id = $1 AND action_type = 'AI_CREDIT_BUILDER_LIMIT_UPDATED' ORDER BY created_at`,
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
      expect(
        (await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(250) })).statusCode
      ).toBe(200);

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

    // Real transactions: inside the suite transaction every request shares one session and the advisory lock never blocks.
    it('AC3: saves racing from no rows each see the one before (ENABLED logged once, UPDATED chained)', async () => {
      await withRealTransactions(async () => {
        const s = await seed(`ac3r${uuidv4().slice(0, 6)}`);
        try {
          licenseWith(app, { aiPlan: 'credits' });
          stubGateway(gatewayFor(s.owner, POOL));
          const values = [110, 120, 130, 140, 150];

          const results = await Promise.all(
            values.map((v) => putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(v) }))
          );

          expect(results.map((r) => r.statusCode)).toEqual(values.map(() => 200));
          await expectOneFlag(s.workspace.id);
          await auditActions(s.workspace.id, values.length + 1);
          await new Promise((r) => setTimeout(r, 500));
          const rows = await auditActions(s.workspace.id, 0);
          // Without the lock every save reads "off, equal share", so each logs ENABLED.
          expect(rows.filter((r) => r.actionType === 'AI_CREDIT_LIMIT_ENABLED')).toHaveLength(1);
          const updates = rows.filter((r) => r.actionType === 'AI_CREDIT_LIMIT_UPDATED');
          expect(updates.filter((r) => r.metadata.before.monthly.mode === 'equal_share')).toHaveLength(1);
        } finally {
          await dropSeed(
            s.workspace.id,
            [s.admin, ...s.builders, s.endUser].map((u) => u.user.id)
          );
        }
      });
    });

    it('saving defaults alone keeps limits as they are (off stays off)', async () => {
      const s = await seed('defonly');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));
      await putLimits(app, s.cookie, s.workspace.id, { enabled: true });
      await putLimits(app, s.cookie, s.workspace.id, { enabled: false });

      const res = await putLimits(app, s.cookie, s.workspace.id, { defaults: customMonthly(120) });

      expect(res.statusCode).toBe(200);
      expect(await limitRows(s.workspace.id)).toEqual([
        { pool: 'addon', mode: 'equal_share', value: null, enabled: false },
        { pool: 'monthly', mode: 'custom', value: 120, enabled: false },
      ]);
    });

    it('custom limits count before any default is saved and survive toggles and default saves (AC6)', async () => {
      const s = await seed('ac6c');
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(gatewayFor(s.owner, POOL));
      const customUser = s.builders[0].user.id;
      await getDefaultDataSource().query(
        `INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled)
         VALUES ($1, $2, 'monthly', 'custom', 400, true)`,
        [s.workspace.id, customUser]
      );
      const customRows = () =>
        getDefaultDataSource().query(
          `SELECT user_id AS "userId", pool, mode, value FROM ai_credit_limits WHERE organization_id = $1 AND user_id IS NOT NULL`,
          [s.workspace.id]
        );
      const seeded = await customRows();

      const before = (await getUsage(app, s.cookie, s.workspace.id)).body;
      expect(before.limits).toMatchObject({ customCount: 1, monthly: { max: 200, customTotal: 400 } });
      expect(before.rows.find((r) => r.userId === customUser).limit).toEqual({ monthly: 400, addon: 25 });

      await putLimits(app, s.cookie, s.workspace.id, { enabled: true, defaults: customMonthly(150) });
      await putLimits(app, s.cookie, s.workspace.id, { enabled: false });
      await putLimits(app, s.cookie, s.workspace.id, { enabled: true });
      await putLimits(app, s.cookie, s.workspace.id, { defaults: customMonthly(200) });

      expect(await customRows()).toEqual(seeded);
      const after = (await getUsage(app, s.cookie, s.workspace.id)).body;
      expect(after.limits).toMatchObject({ enabled: true, customCount: 1, monthly: { value: 200, effective: 200 } });
      expect(after.rows.find((r) => r.userId === customUser).limit.monthly).toBe(400);
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
          expect.objectContaining({
            actionType: 'AI_CREDIT_LIMIT_ENABLED',
            metadata: expect.objectContaining({ buildersOverLimit: 2 }),
          }),
          expect.objectContaining({
            actionType: 'AI_CREDIT_LIMIT_UPDATED',
            metadata: expect.objectContaining({
              before: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
              after: customMonthly(100),
            }),
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

    describe('s9: custom limit for one builder', () => {
      // 4 builders on 1,000 monthly: equal share 250; max for one builder = 1,000 − 3 × 1.
      const custom = (monthly: number | null, addon: number | null = null) => ({ monthly, addon });

      it('AC1/AC3: a custom limit lowers the default, tags the row; Reset removes it and the default rises', async () => {
        const s = await seed('s9ac1');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));
        const target = s.builders[0].user.id;

        const saved = await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(400));
        expect(saved.statusCode).toBe(200);
        expect(await builderRows(target)).toEqual([{ organizationId: s.workspace.id, pool: 'monthly', value: 400 }]);

        const after = (await getUsage(app, s.cookie, s.workspace.id)).body;
        expect(after.limits).toMatchObject({ customCount: 1, monthly: { effective: 200 } });
        const row = after.rows.find((r) => r.userId === target);
        expect(row).toMatchObject({ customLimit: { monthly: 400 }, limit: { monthly: 400, addon: 25 } });
        expect(after.rows.find((r) => r.userId === s.builders[1].user.id).customLimit).toBeUndefined();

        const reset = await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(null));
        expect(reset.statusCode).toBe(200);
        expect(await builderRows(target)).toEqual([]);
        const back = (await getUsage(app, s.cookie, s.workspace.id)).body;
        expect(back.limits).toMatchObject({ customCount: 0, monthly: { effective: 250 } });
        expect(back.rows.find((r) => r.userId === target).customLimit).toBeUndefined();
      });

      it('AC2: over max or not a whole number is a 400 with the design copy; nothing persists', async () => {
        const s = await seed('s9ac2');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));
        const target = s.builders[0].user.id;

        const over = await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(998));
        expect(over.statusCode).toBe(400);
        expect(over.body.message).toBe('Cannot allocate more than 997 per builder');
        for (const bad of [0, -5, 1.5]) {
          expect((await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(bad))).statusCode).toBe(400);
        }
        expect((await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(997))).statusCode).toBe(200);
        await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(null));
        expect((await putBuilderLimit(app, s.cookie, s.workspace.id, target, custom(998))).statusCode).toBe(400);
        expect(await builderRows(target)).toEqual([]);
      });

      it('AC2: an end user, a builder of another workspace or an unknown id is a 404; nothing persists', async () => {
        const a = await seed('s9ac2a');
        const b = await seed('s9ac2b');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(a.owner, POOL));

        const targets = [a.endUser.user.id, b.builders[0].user.id, uuidv4()];
        for (const target of targets) {
          const res = await putBuilderLimit(app, a.cookie, a.workspace.id, target, custom(100));
          expect(res.statusCode).toBe(404);
          expect(await builderRows(target)).toEqual([]);
        }
      });

      it('AC2: a builder or end user cannot set a custom limit (403)', async () => {
        const s = await seed('s9ac2r');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));
        for (const actor of [s.builders[1], s.endUser]) {
          const cookie = await sessionFor(actor.user, s.workspace.id);
          const res = await putBuilderLimit(app, cookie, s.workspace.id, s.builders[0].user.id, custom(100));
          expect(res.statusCode).toBe(403);
        }
        expect(await builderRows(s.builders[0].user.id)).toEqual([]);
      });

      it('AC5: each changed pool logs BUILDER_LIMIT_UPDATED with actor, builder, pool, before and after', async () => {
        const s = await seed('s9ac5');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));
        const target = s.builders[0];

        await putBuilderLimit(app, s.cookie, s.workspace.id, target.user.id, custom(400));
        await putBuilderLimit(app, s.cookie, s.workspace.id, target.user.id, custom(400, 20));
        await putBuilderLimit(app, s.cookie, s.workspace.id, target.user.id, custom(400, 20));

        const rows = await builderAudit(s.workspace.id, 2);
        await new Promise((r) => setTimeout(r, 300));
        expect(await builderAudit(s.workspace.id, 2)).toHaveLength(2);
        const base = { builderId: target.user.id, builderEmail: target.user.email };
        expect(rows.map((r) => r.userId)).toEqual([s.admin.user.id, s.admin.user.id]);
        expect(rows[0].metadata).toMatchObject({ ...base, pool: 'monthly', before: null, after: 400 });
        expect(rows[1].metadata).toMatchObject({ ...base, pool: 'addon', before: null, after: 20 });
      });

      it('AC4: a save racing an archive never leaves a custom limit behind', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`s9race${uuidv4().slice(0, 6)}`);
          try {
            licenseWith(app, { aiPlan: 'credits' });
            stubGateway(gatewayFor(s.owner, POOL));
            const target = s.builders[0];

            const [save, archive] = await Promise.all([
              putBuilderLimit(app, s.cookie, s.workspace.id, target.user.id, custom(400)),
              request(app.getHttpServer())
                .post(`/api/organization-users/${target.orgUser.id}/archive`)
                .set('tj-workspace-id', s.workspace.id)
                .set('Cookie', s.cookie)
                .send({}),
            ]);

            expect(archive.statusCode).toBe(201);
            expect([200, 404]).toContain(save.statusCode);
            expect(await builderRows(target.user.id)).toEqual([]);
          } finally {
            await dropSeed(
              s.workspace.id,
              [s.admin, ...s.builders, s.endUser].map((u) => u.user.id)
            );
          }
        });
      });

      it('AC4: archiving the builder or making them an end user removes the custom limit and the default rises', async () => {
        const s = await seed('s9ac4');
        licenseWith(app, { aiPlan: 'credits' });
        stubGateway(gatewayFor(s.owner, POOL));
        const [archived] = s.builders;
        // Seeded builders also sit in the end-user group; a real member has one role.
        const demoted = await createUser(app, {
          email: 's9ac4-demoted@tooljet.io',
          groups: ['builder'],
          organization: s.workspace,
        });
        await putBuilderLimit(app, s.cookie, s.workspace.id, archived.user.id, custom(400));
        await putBuilderLimit(app, s.cookie, s.workspace.id, demoted.user.id, custom(300));

        const archive = await request(app.getHttpServer())
          .post(`/api/organization-users/${archived.orgUser.id}/archive`)
          .set('tj-workspace-id', s.workspace.id)
          .set('Cookie', s.cookie)
          .send({});
        expect(archive.statusCode).toBe(201);
        expect(await builderRows(archived.user.id)).toEqual([]);

        const demote = await request(app.getHttpServer())
          .put('/api/v2/group-permissions/role/user')
          .set('tj-workspace-id', s.workspace.id)
          .set('Cookie', s.cookie)
          .send({ newRole: 'end-user', userId: demoted.user.id });
        expect(demote.statusCode).toBe(200);
        expect(await builderRows(demoted.user.id)).toEqual([]);

        // Admin + 2 builders left, no custom limits: 1,000 ÷ 3.
        const limits = (await getUsage(app, s.cookie, s.workspace.id)).body.limits;
        expect(limits).toMatchObject({ builderCount: 3, customCount: 0, monthly: { effective: 333 } });
      });
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
      licenseWith(app, {
        aiPlan: 'credits',
        aiEnabled: true,
        ai: { apiKey: 'selfhost-key' },
        metadata: { customerId },
      });

    it('super admin saves one instance-wide default (no workspace on the rows)', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh6-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      await createUser(app, {
        email: 'sh6-other@tooljet.io',
        groups: ['end-user', 'admin'],
        organizationName: 'Other',
      });
      selfhostLicense();
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));
      const cookie = await sessionFor(superAdmin.user, superAdmin.organization.id);

      const res = await putLimits(app, cookie, superAdmin.organization.id, { enabled: true });

      expect(res.statusCode).toBe(200);
      expect(await limitRows(null)).toHaveLength(2);
      expect(await limitRows(superAdmin.organization.id)).toEqual([]);
      const limits = (await getUsage(app, cookie, superAdmin.organization.id)).body.limits;
      expect(limits).toMatchObject({ enabled: true, builderCount: 2, monthly: { effective: 500 } });
      const [enabled] = await auditActions(superAdmin.organization.id, 1);
      expect(enabled.metadata).toMatchObject({ instance_level: true });
    });

    it('s9 AC4: archived in one of two workspaces keeps the custom limit; archived everywhere removes it', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh9-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const other = await createUser(app, {
        email: 'sh9-other@tooljet.io',
        groups: ['end-user', 'admin'],
        organizationName: 'Other s9',
      });
      const inHome = await createUser(app, {
        email: 'sh9-builder@tooljet.io',
        groups: ['end-user', 'builder'],
        organization: superAdmin.organization,
      });
      const inOther = await createUser(
        app,
        { email: 'sh9-builder@tooljet.io', groups: ['end-user', 'builder'], organization: other.organization },
        inHome.user
      );
      selfhostLicense();
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));
      const cookie = await sessionFor(superAdmin.user, superAdmin.organization.id);
      const builderId = inHome.user.id;

      const saved = await putBuilderLimit(app, cookie, superAdmin.organization.id, builderId, {
        monthly: 400,
        addon: null,
      });
      expect(saved.statusCode).toBe(200);
      expect(await builderRows(builderId)).toEqual([{ organizationId: null, pool: 'monthly', value: 400 }]);

      const archiveOne = await request(app.getHttpServer())
        .post(`/api/organization-users/${inOther.orgUser.id}/archive`)
        .set('tj-workspace-id', superAdmin.organization.id)
        .set('Cookie', cookie)
        .send({ organizationId: other.organization.id });
      expect(archiveOne.statusCode).toBe(201);
      expect(await builderRows(builderId)).toHaveLength(1);

      const archiveAll = await request(app.getHttpServer())
        .post(`/api/organization-users/${builderId}/archive-all`)
        .set('tj-workspace-id', superAdmin.organization.id)
        .set('Cookie', cookie)
        .send({});
      expect(archiveAll.statusCode).toBe(201);
      expect(await builderRows(builderId)).toEqual([]);
      const [entry] = await builderAudit(superAdmin.organization.id, 1);
      expect(entry.metadata).toMatchObject({ instance_level: true, pool: 'monthly', after: 400 });
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

    it('s9: setting a builder limit returns 404', async () => {
      const admin = await createUser(app, { email: 'ce9-admin@tooljet.io', groups: ['end-user', 'admin'] });

      const res = await putBuilderLimit(
        app,
        await sessionFor(admin.user, admin.organization.id),
        admin.organization.id,
        admin.user.id,
        { monthly: 1, addon: null }
      );

      expect(res.statusCode).toBe(404);
    });

    it('saving limits returns 404', async () => {
      const admin = await createUser(app, { email: 'ce6-admin@tooljet.io', groups: ['end-user', 'admin'] });

      const res = await putLimits(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id, {
        enabled: true,
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
