import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createUser, buildTestSession, getDefaultDataSource } from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { OrganizationAiKey } from '@entities/organization_ai_key.entity';
import { User } from '@entities/user.entity';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';
const RENEWS = '2026-11-01T00:00:00.000Z';
const TOPUP_EXPIRES = '2027-08-02T00:00:00.000Z';
const TRACKING_SINCE = '2026-10-03T09:00:00.000Z';

type GatewayRoutes = Record<string, unknown>;

/** Stubs fetch at the gateway HTTP boundary; every other URL goes to the real fetch. */
function stubGateway(routes: GatewayRoutes) {
  const realFetch = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (!url.startsWith(GATEWAY)) return realFetch(input, init);
    const path = url.slice(GATEWAY.length);
    if (!(path in routes)) return new Response(JSON.stringify({ message: 'not stubbed' }), { status: 404 });
    return new Response(JSON.stringify(routes[path]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
}

/** Overrides selected licence terms; everything else keeps the plan mock's value. */
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

const balance = (recurring: { plan: number; remaining: number }, topup: { plan: number; remaining: number }) => ({
  balance: recurring.remaining + topup.remaining,
  plan: { recurring: recurring.plan, topup: topup.plan, total: recurring.plan + topup.plan },
  remaining: { recurring: recurring.remaining, topup: topup.remaining, total: recurring.remaining + topup.remaining },
  expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: TOPUP_EXPIRES },
  cycleStart: CYCLE_START,
});

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

const getUsage = (app: INestApplication, cookie: string[], organizationId: string) =>
  request(app.getHttpServer())
    .get('/api/ai/credits-usage')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie);

/** Gateway WalletTotals for one person or workspace. */
const spent = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

const sum = (rows: { monthly: number; addon: number }[], key: 'monthly' | 'addon') =>
  Math.round(rows.reduce((acc, r) => acc + r[key], 0) * 100) / 100;

/** @group ai */
describe('GET /api/ai/credits-usage', () => {
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

    async function seedWorkspace(prefix: string) {
      const admin = await createUser(app, {
        email: `${prefix}-admin@tooljet.io`,
        firstName: 'Ada',
        lastName: 'Admin',
        groups: ['end-user', 'admin'],
      });
      const workspace = admin.organization;
      const builderOne = await createUser(app, {
        email: `${prefix}-b1@tooljet.io`,
        firstName: 'Bea',
        lastName: 'One',
        groups: ['end-user', 'builder'],
        organization: workspace,
      });
      const builderTwo = await createUser(app, {
        email: `${prefix}-b2@tooljet.io`,
        firstName: 'Ben',
        lastName: 'Two',
        groups: ['end-user', 'builder'],
        organization: workspace,
      });
      const idleBuilder = await createUser(app, {
        email: `${prefix}-idle@tooljet.io`,
        firstName: 'Ida',
        lastName: 'Idle',
        groups: ['end-user', 'builder'],
        organization: workspace,
        status: 'invited',
      });
      const endUser = await createUser(app, {
        email: `${prefix}-end@tooljet.io`,
        firstName: 'Eve',
        lastName: 'End',
        groups: ['end-user'],
        organization: workspace,
      });
      const archivedBuilder = await createUser(app, {
        email: `${prefix}-archived@tooljet.io`,
        firstName: 'Noah',
        lastName: 'Williams',
        groups: ['end-user', 'builder'],
        organization: workspace,
        status: 'archived',
      });
      return { workspace, admin, builderOne, builderTwo, idleBuilder, endUser, archivedBuilder };
    }

    function usageFor(
      seed: Awaited<ReturnType<typeof seedWorkspace>>,
      unknownUserId: string,
      trackingSince: string | null
    ) {
      return {
        since: CYCLE_START,
        cycleStart: CYCLE_START,
        trackingSince,
        users: [
          { userId: seed.admin.user.id, ...spent(100) },
          { userId: seed.builderOne.user.id, ...spent(50, 20) },
          { userId: seed.builderTwo.user.id, ...spent(30.5) },
          { userId: seed.endUser.user.id, ...spent(5) },
          { userId: unknownUserId, ...spent(7) },
          { userId: seed.archivedBuilder.user.id, ...spent(9) },
        ],
        unattributed: { recurring: 11, topup: 2, total: 13 },
        pool: { recurring: 212.5, topup: 22, total: 234.5 },
      };
    }

    it('AC1 AC5 AC6: admin gets pool totals and one row per builder, archived, end user, unknown user and unattributed spend', async () => {
      const seed = await seedWorkspace('ac1');
      const unknownUserId = uuidv4();
      const orgId = seed.workspace.id;
      licenseWith(app, { aiPlan: 'credits' });
      const fetchSpy = stubGateway({
        [`/api/ai/organizations/${orgId}/balance`]: balance(
          { plan: 1000, remaining: 787.5 },
          { plan: 100, remaining: 78 }
        ),
        [`/api/ai/organizations/${orgId}/usage`]: usageFor(seed, unknownUserId, TRACKING_SINCE),
      });

      const res = await getUsage(app, await sessionFor(seed.admin.user, orgId), orgId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        cycle: { start: CYCLE_START, end: RENEWS },
        trackingSince: TRACKING_SINCE,
        pools: {
          monthly: { total: 1000, remaining: 787.5, used: 212.5, endsAt: RENEWS },
          addon: { total: 100, remaining: 78, used: 22, endsAt: TOPUP_EXPIRES },
        },
      });
      expect(res.body.workspaces).toBeUndefined();

      const byUser = (id: string) => res.body.rows.find((r) => r.userId === id);
      expect(byUser(seed.admin.user.id)).toMatchObject({
        kind: 'builder',
        name: 'Ada Admin',
        email: 'ac1-admin@tooljet.io',
        monthly: 100,
        addon: 0,
      });
      expect(byUser(seed.builderOne.user.id)).toMatchObject({ kind: 'builder', monthly: 50, addon: 20 });
      expect(byUser(seed.builderTwo.user.id)).toMatchObject({ kind: 'builder', monthly: 30.5, addon: 0 });
      expect(byUser(seed.idleBuilder.user.id)).toMatchObject({ kind: 'builder', monthly: 0, addon: 0 });
      expect(byUser(seed.archivedBuilder.user.id)).toMatchObject({
        kind: 'archived',
        name: 'Noah Williams',
        monthly: 9,
        addon: 0,
      });
      expect(byUser(seed.endUser.user.id)).toMatchObject({ kind: 'nonBuilder', name: 'Eve End', monthly: 5 });
      expect(byUser(unknownUserId)).toMatchObject({ kind: 'unknown', monthly: 7, addon: 0 });
      expect(byUser(unknownUserId).name).toBeUndefined();
      expect(res.body.rows.find((r) => r.kind === 'unattributed')).toMatchObject({ monthly: 11, addon: 2 });
      expect(res.body.rows.filter((r) => r.kind === 'unattributed')).toHaveLength(1);

      expect(sum(res.body.rows, 'monthly')).toBe(res.body.pools.monthly.used);
      expect(sum(res.body.rows, 'addon')).toBe(res.body.pools.addon.used);

      const gatewayCalls = fetchSpy.mock.calls.map(([url]) => String(url)).filter((u) => u.startsWith(GATEWAY));
      expect(gatewayCalls).toContain(`${GATEWAY}/api/ai/organizations/${orgId}/usage`);
    });

    it('returns a null trackingSince when the gateway has no attributed row yet', async () => {
      const seed = await seedWorkspace('nulltrack');
      const orgId = seed.workspace.id;
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway({
        [`/api/ai/organizations/${orgId}/balance`]: balance({ plan: 1000, remaining: 1000 }, { plan: 0, remaining: 0 }),
        [`/api/ai/organizations/${orgId}/usage`]: {
          since: CYCLE_START,
          cycleStart: CYCLE_START,
          trackingSince: null,
          users: [],
          unattributed: { recurring: 0, topup: 0, total: 0 },
          pool: { recurring: 0, topup: 0, total: 0 },
        },
      });

      const res = await getUsage(app, await sessionFor(seed.admin.user, orgId), orgId);

      expect(res.statusCode).toBe(200);
      expect(res.body.trackingSince).toBeNull();
    });

    it('AC2: a builder gets 403', async () => {
      const seed = await seedWorkspace('ac2');
      const orgId = seed.workspace.id;
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway({});

      const res = await getUsage(app, await sessionFor(seed.builderOne.user, orgId), orgId);

      expect(res.statusCode).toBe(403);
    });

    it("AC3: workspace B's admin only reaches workspace B and never sees A's people", async () => {
      const a = await seedWorkspace('ac3a');
      const b = await seedWorkspace('ac3b');
      licenseWith(app, { aiPlan: 'credits' });
      const fetchSpy = stubGateway({
        [`/api/ai/organizations/${b.workspace.id}/balance`]: balance(
          { plan: 1000, remaining: 900 },
          { plan: 0, remaining: 0 }
        ),
        // A gateway answer that wrongly names A's builder must not reveal who that is.
        [`/api/ai/organizations/${b.workspace.id}/usage`]: {
          since: CYCLE_START,
          cycleStart: CYCLE_START,
          trackingSince: null,
          users: [{ userId: a.builderOne.user.id, ...spent(100) }],
          unattributed: { recurring: 0, topup: 0, total: 0 },
          pool: { recurring: 100, topup: 0, total: 100 },
        },
      });

      const res = await getUsage(app, await sessionFor(b.admin.user, b.workspace.id), b.workspace.id);

      expect(res.statusCode).toBe(200);
      const gatewayCalls = fetchSpy.mock.calls.map(([url]) => String(url)).filter((u) => u.startsWith(GATEWAY));
      expect(gatewayCalls.every((u) => u.includes(b.workspace.id))).toBe(true);
      const body = JSON.stringify(res.body);
      for (const seeded of [a.admin, a.builderOne, a.builderTwo, a.endUser]) {
        expect(body).not.toContain(seeded.user.email);
      }
      expect(res.body.rows.find((r) => r.userId === a.builderOne.user.id)).toMatchObject({ kind: 'unknown' });
    });

    it('AC4: a BYOK workspace on its own provider gets 403', async () => {
      const seed = await seedWorkspace('ac4byok');
      const orgId = seed.workspace.id;
      await getDefaultDataSource()
        .getRepository(OrganizationAiKey)
        .save({ organizationId: orgId, encryptedKey: 'x', provider: 'anthropic' });
      licenseWith(app, { aiPlan: 'byok' });
      stubGateway({});

      const res = await getUsage(app, await sessionFor(seed.admin.user, orgId), orgId);

      expect(res.statusCode).toBe(403);
    });

    it('AC4: a BYOK workspace that falls back to ToolJet credits gets the page', async () => {
      const seed = await seedWorkspace('ac4fallback');
      const orgId = seed.workspace.id;
      licenseWith(app, { aiPlan: 'byok' });
      stubGateway({
        [`/api/ai/organizations/${orgId}/balance`]: balance({ plan: 1000, remaining: 1000 }, { plan: 0, remaining: 0 }),
        [`/api/ai/organizations/${orgId}/usage`]: {
          since: CYCLE_START,
          cycleStart: CYCLE_START,
          trackingSince: null,
          users: [],
          unattributed: { recurring: 0, topup: 0, total: 0 },
          pool: { recurring: 0, topup: 0, total: 0 },
        },
      });

      const res = await getUsage(app, await sessionFor(seed.admin.user, orgId), orgId);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s5';

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

    it('super admin gets instance-wide rows with workspace memberships, a per-workspace split and the workspace list', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh-super@tooljet.io',
        firstName: 'Sam',
        lastName: 'Super',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const sales = superAdmin.organization;
      const finance = (
        await createUser(app, {
          email: 'sh-fin-admin@tooljet.io',
          groups: ['end-user', 'admin'],
          organizationName: 'Finance Tools',
        })
      ).organization;
      const builder = await createUser(app, {
        email: 'sh-builder@tooljet.io',
        firstName: 'Priya',
        lastName: 'Nair',
        groups: ['end-user', 'builder'],
        organization: sales,
      });
      await createUser(app, { groups: ['end-user', 'builder'], organization: finance }, builder.user);

      const unknownUserId = uuidv4();
      selfhostLicense();
      const fetchSpy = stubGateway({
        [`/api/ai/selfhost-customers/${customerId}/balance`]: balance(
          { plan: 80000, remaining: 79900 },
          { plan: 0, remaining: 0 }
        ),
        [`/api/ai/selfhost-customers/${customerId}/usage?groupBy=organization`]: {
          since: CYCLE_START,
          cycleStart: CYCLE_START,
          trackingSince: TRACKING_SINCE,
          users: [
            {
              userId: builder.user.id,
              ...spent(100),
              byOrganization: [
                { organizationId: sales.id, ...spent(60) },
                { organizationId: finance.id, ...spent(40) },
              ],
            },
            {
              userId: unknownUserId,
              ...spent(7),
              byOrganization: [{ organizationId: finance.id, ...spent(7) }],
            },
          ],
          unattributed: { recurring: 0, topup: 0, total: 0 },
          pool: { recurring: 107, topup: 0, total: 107 },
        },
      });

      const res = await getUsage(app, await sessionFor(superAdmin.user, sales.id), sales.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.workspaces).toEqual(
        expect.arrayContaining([
          { id: sales.id, name: sales.name },
          { id: finance.id, name: 'Finance Tools' },
        ])
      );
      expect(res.body.rows.find((r) => r.userId === builder.user.id)).toMatchObject({
        kind: 'builder',
        name: 'Priya Nair',
        workspaceIds: expect.arrayContaining([sales.id, finance.id]),
        monthly: 100,
        addon: 0,
        byWorkspace: expect.arrayContaining([
          { organizationId: sales.id, monthly: 60, addon: 0 },
          { organizationId: finance.id, monthly: 40, addon: 0 },
        ]),
      });
      // Unknown spenders keep their workspace split so the workspace filter can place them.
      expect(res.body.rows.find((r) => r.userId === unknownUserId)).toMatchObject({
        kind: 'unknown',
        byWorkspace: [{ organizationId: finance.id, monthly: 7, addon: 0 }],
      });
      const gatewayCalls = fetchSpy.mock.calls.map(([url]) => String(url)).filter((u) => u.startsWith(GATEWAY));
      expect(gatewayCalls).toContain(`${GATEWAY}/api/ai/selfhost-customers/${customerId}/usage?groupBy=organization`);
    });

    it('AC2: a workspace admin who is not a super admin gets 403', async () => {
      const admin = await createUser(app, { email: 'sh-ws-admin@tooljet.io', groups: ['end-user', 'admin'] });
      selfhostLicense();
      stubGateway({});

      const res = await getUsage(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id);

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

    it('AC2: returns 404', async () => {
      const admin = await createUser(app, { email: 'ce-admin@tooljet.io', groups: ['end-user', 'admin'] });

      const res = await getUsage(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id);

      expect(res.statusCode).toBe(404);
    });
  });
});
