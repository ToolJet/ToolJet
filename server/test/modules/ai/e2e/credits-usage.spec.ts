import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createUser, getDefaultDataSource, ENTERPRISE_TEST_TERMS } from 'test-helper';
import { OrganizationAiKey } from '@entities/organization_ai_key.entity';
import { Terms } from '@modules/licensing/interfaces/terms';
import {
  CYCLE_START,
  GATEWAY,
  RENEWS,
  SELF_HOSTED_CUSTOMER,
  SELF_HOSTED_TERMS,
  TEAM_TERMS,
  gatewayFor,
  sessionFor,
  stubGateway,
  useLicence,
} from './credits-gateway';

/** @group ai */
describe('AI credits usage: GET /api/ai/credits-usage and /api/ai/credits-usage/me', () => {
  const previous = { gateway: process.env.TJ_AI_GATEWAY_URL, features: process.env.ENABLE_AI_FEATURES };

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
  });

  afterAll(() => {
    process.env.TJ_AI_GATEWAY_URL = previous.gateway;
    process.env.ENABLE_AI_FEATURES = previous.features;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cloud', () => {
    let app: INestApplication;
    let restoreLicence: (() => void) | undefined;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'cloud', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'cloud';
    });

    afterEach(() => {
      restoreLicence?.();
      restoreLicence = undefined;
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Admin + 2 builders = 3 builders, plus an end user. */
    async function seed(name: string) {
      const admin = await createUser(app, {
        email: `${name}-admin@tooljet.io`,
        firstName: 'Ada',
        lastName: 'Admin',
        groups: ['admin'],
      });
      const workspace = admin.organization;
      const builderOne = await createUser(app, {
        email: `${name}-b1@tooljet.io`,
        groups: ['builder'],
        organization: workspace,
      });
      const builderTwo = await createUser(app, {
        email: `${name}-b2@tooljet.io`,
        groups: ['builder'],
        organization: workspace,
      });
      const endUser = await createUser(app, {
        email: `${name}-end@tooljet.io`,
        firstName: 'Eve',
        lastName: 'End',
        groups: ['end-user'],
        organization: workspace,
      });
      return {
        workspace,
        admin,
        builderOne,
        builderTwo,
        endUser,
        owner: `/api/ai/organizations/${workspace.id}`,
        adminCookie: await sessionFor(admin.user, workspace.id),
      };
    }

    const getUsage = (cookie: string[], organizationId: string) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie);

    const getMine = (cookie: string[], organizationId: string, query = '') =>
      request(app.getHttpServer())
        .get(`/api/ai/credits-usage/me${query}`)
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie);

    it('an admin gets pool totals and a row per builder, archived builder, end user who spent, unknown user and unattributed spend', async () => {
      const s = await seed('sales');
      const idle = await createUser(app, {
        email: 'sales-idle@tooljet.io',
        groups: ['builder'],
        organization: s.workspace,
        status: 'invited',
      });
      const archived = await createUser(app, {
        email: 'sales-archived@tooljet.io',
        firstName: 'Noah',
        lastName: 'Williams',
        groups: ['builder'],
        organization: s.workspace,
        status: 'archived',
      });
      const unknownUserId = uuidv4();
      stubGateway({
        [`${s.owner}/balance`]: {
          balance: 865.5,
          remaining: { recurring: 787.5, topup: 78, total: 865.5 },
          expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: '2027-08-02T00:00:00.000Z' },
          cycleStart: CYCLE_START,
        },
        [`${s.owner}/usage`]: {
          cycleStart: CYCLE_START,
          trackingSince: '2026-10-03T09:00:00.000Z',
          users: [
            { userId: s.admin.user.id, recurring: 100, topup: 0, total: 100 },
            { userId: s.builderOne.user.id, recurring: 50, topup: 20, total: 70 },
            { userId: s.builderTwo.user.id, recurring: 30.5, topup: 0, total: 30.5 },
            { userId: s.endUser.user.id, recurring: 5, topup: 0, total: 5 },
            { userId: unknownUserId, recurring: 7, topup: 0, total: 7 },
            { userId: archived.user.id, recurring: 9, topup: 0, total: 9 },
          ],
          unattributed: { recurring: 11, topup: 2, total: 13 },
          pool: { recurring: 212.5, topup: 22, total: 234.5 },
        },
      });

      const res = await getUsage(s.adminCookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        cycle: { start: CYCLE_START, end: RENEWS },
        trackingSince: '2026-10-03T09:00:00.000Z',
        pools: {
          monthly: { total: 1000, remaining: 787.5, used: 212.5, endsAt: RENEWS },
          addon: { total: 100, remaining: 78, used: 22, endsAt: '2027-08-02T00:00:00.000Z' },
        },
      });
      expect(res.body.workspaces).toBeUndefined();
      const byUser = (id: string) => res.body.rows.find((r) => r.userId === id);
      expect(byUser(s.admin.user.id)).toMatchObject({
        kind: 'builder',
        name: 'Ada Admin',
        email: 'sales-admin@tooljet.io',
        monthly: 100,
        addon: 0,
      });
      // Limits are on in a new workspace: 50 + 20 is within the monthly limit, so all of it is monthly.
      expect(byUser(s.builderOne.user.id)).toMatchObject({ kind: 'builder', monthly: 70, addon: 0 });
      expect(byUser(s.builderTwo.user.id)).toMatchObject({ kind: 'builder', monthly: 30.5, addon: 0 });
      expect(byUser(idle.user.id)).toMatchObject({ kind: 'builder', monthly: 0, addon: 0 });
      expect(byUser(archived.user.id)).toMatchObject({ kind: 'archived', name: 'Noah Williams', monthly: 9 });
      expect(byUser(s.endUser.user.id)).toMatchObject({ kind: 'nonBuilder', name: 'Eve End', monthly: 5 });
      expect(byUser(unknownUserId)).toEqual({ kind: 'unknown', userId: unknownUserId, monthly: 7, addon: 0 });
      expect(res.body.rows.filter((r) => r.kind === 'unattributed')).toEqual([
        { kind: 'unattributed', monthly: 11, addon: 2 },
      ]);
    });

    it('a builder cannot read workspace usage (403)', async () => {
      const s = await seed('sales');
      stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 0 }));

      const res = await getUsage(await sessionFor(s.builderOne.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(403);
    });

    it("an admin only sees their own workspace's people, even when the gateway names someone from another", async () => {
      const sales = await seed('sales');
      const finance = await seed('finance');
      const gateway = stubGateway(
        gatewayFor(finance.owner, { monthly: 1000, addon: 0 }, { [sales.builderOne.user.id]: 100 })
      );

      const res = await getUsage(finance.adminCookie, finance.workspace.id);

      expect(res.statusCode).toBe(200);
      const gatewayUrls = gateway.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith(GATEWAY));
      expect(gatewayUrls.every((url) => url.includes(finance.workspace.id))).toBe(true);
      expect(res.body.rows.find((r) => r.userId === sales.builderOne.user.id)).toEqual({
        kind: 'unknown',
        userId: sales.builderOne.user.id,
        monthly: 100,
        addon: 0,
      });
      expect(JSON.stringify(res.body)).not.toContain('sales-');
    });

    it('a workspace using its own AI provider key gets 403 on usage and no limits of its own', async () => {
      const s = await seed('byok');
      await getDefaultDataSource()
        .getRepository(OrganizationAiKey)
        .save({ organizationId: s.workspace.id, encryptedKey: 'x', provider: 'anthropic' });
      restoreLicence = useLicence(app, { ...ENTERPRISE_TEST_TERMS, ai: { plan: 'byok' } } as Partial<Terms>);
      stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 0 }));

      const usage = await getUsage(s.adminCookie, s.workspace.id);
      const mine = await getMine(await sessionFor(s.builderOne.user, s.workspace.id), s.workspace.id);

      expect(usage.statusCode).toBe(403);
      expect(mine.statusCode).toBe(200);
      expect(mine.body.enabled).toBe(false);
    });

    it('a BYOK workspace with no key of its own falls back to ToolJet credits and gets the page', async () => {
      const s = await seed('fallback');
      restoreLicence = useLicence(app, { ...ENTERPRISE_TEST_TERMS, ai: { plan: 'byok' } } as Partial<Terms>);
      stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 0 }));

      const res = await getUsage(s.adminCookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.pools.monthly).toMatchObject({ total: 1000, used: 0 });
    });

    it("limits off: a builder's row shows spend by wallet; limits on: the first {monthly limit} counts as monthly", async () => {
      const s = await seed('split');
      // 3 builders on 6,000 + 1,200: limit 2,000 + 400 each. The builder spent 1,700 monthly + 340 add-on.
      stubGateway(
        gatewayFor(
          s.owner,
          { monthly: 6000, addon: 1200 },
          { [s.builderOne.user.id]: 1700 },
          { addonSpend: { [s.builderOne.user.id]: 340 } }
        )
      );
      const setLimits = (enabled: boolean) =>
        request(app.getHttpServer())
          .put('/api/ai/credits-usage/limits')
          .set('tj-workspace-id', s.workspace.id)
          .set('Cookie', s.adminCookie)
          .send({ enabled })
          .expect(200);

      await setLimits(false);
      const off = await getUsage(s.adminCookie, s.workspace.id);
      await setLimits(true);
      const on = await getUsage(s.adminCookie, s.workspace.id);

      expect(off.body.rows.find((r) => r.userId === s.builderOne.user.id)).toMatchObject({ monthly: 1700, addon: 340 });
      expect(on.body.rows.find((r) => r.userId === s.builderOne.user.id)).toMatchObject({
        monthly: 2000,
        addon: 40,
        limit: { monthly: 2000, addon: 400 },
      });
      // Pool cards always show the wallets.
      expect(on.body.pools.monthly).toMatchObject({ total: 6000, used: 1700 });
      expect(on.body.pools.addon).toMatchObject({ total: 1200, used: 340 });
    });

    it("an overdrawn pool shows negative remaining; with no add-on limit the overshoot stays on the builder's monthly", async () => {
      const s = await seed('overdrawn');
      // 3 builders on 1,500: limit 500 each. The builder's last action overshot to 1,600.
      stubGateway(gatewayFor(s.owner, { monthly: 1500, addon: 0 }, { [s.builderOne.user.id]: 1600 }));

      const res = await getUsage(s.adminCookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.pools.monthly).toMatchObject({ total: 1500, used: 1600, remaining: -100 });
      expect(res.body.rows.find((r) => r.userId === s.builderOne.user.id)).toMatchObject({
        monthly: 1600,
        addon: 0,
        limit: { monthly: 500, addon: 0 },
      });
    });

    it('on a Team licence limits are not available, but pool cards and rows are still served', async () => {
      const s = await seed('team');
      restoreLicence = useLicence(app, TEAM_TERMS);
      stubGateway(gatewayFor(s.owner, { monthly: 1500, addon: 0 }, { [s.builderOne.user.id]: 600 }));

      const usage = await getUsage(s.adminCookie, s.workspace.id);
      const mine = await getMine(await sessionFor(s.builderOne.user, s.workspace.id), s.workspace.id);

      expect(usage.statusCode).toBe(200);
      expect(usage.body).toMatchObject({ limitsAvailable: false, limits: { enabled: false } });
      expect(usage.body.pools.monthly).toMatchObject({ total: 1500, used: 600 });
      expect(usage.body.rows.find((r) => r.userId === s.builderOne.user.id)).toMatchObject({ monthly: 600 });
      expect(mine.statusCode).toBe(200);
      expect(mine.body.enabled).toBe(false);
    });

    it('a builder gets their own used, limit and left per pool, and the pool balance', async () => {
      const s = await seed('mine');
      // 3 builders on 900 + 90: limit 300 + 30 each.
      stubGateway(
        gatewayFor(s.owner, { monthly: 900, addon: 90 }, { [s.builderOne.user.id]: 250, [s.builderTwo.user.id]: 40 })
      );

      const res = await getMine(await sessionFor(s.builderOne.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        enabled: true,
        cycleStart: CYCLE_START,
        monthly: { used: 250, limit: 300, left: 50, renewsOn: RENEWS },
        addon: { used: 0, limit: 30, left: 30, expiresOn: null },
        pool: expect.objectContaining({ aiFeaturesEnabled: true, aiPlan: 'credits', balance: 700 }),
      });
    });

    it('a userId in the query is ignored: a builder always gets their own numbers', async () => {
      const s = await seed('mine');
      stubGateway(
        gatewayFor(s.owner, { monthly: 900, addon: 90 }, { [s.builderOne.user.id]: 250, [s.builderTwo.user.id]: 40 })
      );

      const res = await getMine(
        await sessionFor(s.builderOne.user, s.workspace.id),
        s.workspace.id,
        `?userId=${s.builderTwo.user.id}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.monthly).toEqual({ used: 250, limit: 300, left: 50, renewsOn: RENEWS });
    });

    it('limits off: a builder gets enabled false and the pool balance', async () => {
      const s = await seed('mine');
      stubGateway(gatewayFor(s.owner, { monthly: 900, addon: 90 }));
      await request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.adminCookie)
        .send({ enabled: false })
        .expect(200);

      const res = await getMine(await sessionFor(s.builderOne.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        enabled: false,
        pool: expect.objectContaining({ aiFeaturesEnabled: true, aiPlan: 'credits', balance: 990 }),
      });
    });

    it('an end user cannot read their own credits (403)', async () => {
      const s = await seed('mine');
      stubGateway(gatewayFor(s.owner, { monthly: 900, addon: 90 }));

      const res = await getMine(await sessionFor(s.endUser.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    let restoreLicence: () => void;
    const owner = `/api/ai/selfhost-customers/${SELF_HOSTED_CUSTOMER}`;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
      restoreLicence = useLicence(app, SELF_HOSTED_TERMS);
    });

    afterAll(async () => {
      restoreLicence();
      await closeTestApp(app);
    }, 60_000);

    it('a super admin gets instance-wide rows with workspace memberships, a per-workspace split and the workspace list', async () => {
      const superAdmin = await createUser(app, {
        email: 'super@tooljet.io',
        userType: 'instance',
        groups: ['admin'],
      });
      const sales = superAdmin.organization;
      const finance = (
        await createUser(app, {
          email: 'finance-admin@tooljet.io',
          groups: ['admin'],
          organizationName: 'Finance Tools',
        })
      ).organization;
      const logistics = (
        await createUser(app, {
          email: 'logistics-admin@tooljet.io',
          groups: ['admin'],
          organizationName: 'Logistics',
        })
      ).organization;
      const builder = await createUser(app, {
        email: 'priya@tooljet.io',
        firstName: 'Priya',
        lastName: 'Nair',
        groups: ['builder'],
        organization: sales,
      });
      await createUser(app, { groups: ['builder'], organization: finance }, builder.user);
      // An end user in Logistics: the workspace filter must not list them there.
      await createUser(app, { groups: ['end-user'], organization: logistics }, builder.user);
      const unknownUserId = uuidv4();
      stubGateway({
        [`${owner}/balance`]: {
          balance: 79_900,
          remaining: { recurring: 79_900, topup: 0, total: 79_900 },
          expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: null },
          cycleStart: CYCLE_START,
        },
        [`${owner}/usage?groupBy=organization`]: {
          cycleStart: CYCLE_START,
          trackingSince: null,
          users: [
            {
              userId: builder.user.id,
              recurring: 100,
              topup: 0,
              total: 100,
              byOrganization: [
                { organizationId: sales.id, recurring: 60, topup: 0, total: 60 },
                { organizationId: finance.id, recurring: 40, topup: 0, total: 40 },
              ],
            },
            {
              userId: unknownUserId,
              recurring: 7,
              topup: 0,
              total: 7,
              byOrganization: [{ organizationId: finance.id, recurring: 7, topup: 0, total: 7 }],
            },
          ],
          unattributed: { recurring: 0, topup: 0, total: 0 },
          pool: { recurring: 107, topup: 0, total: 107 },
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', sales.id)
        .set('Cookie', await sessionFor(superAdmin.user, sales.id));

      expect(res.statusCode).toBe(200);
      expect(res.body.workspaces).toEqual(
        expect.arrayContaining([
          { id: sales.id, name: sales.name },
          { id: finance.id, name: 'Finance Tools' },
          { id: logistics.id, name: 'Logistics' },
        ])
      );
      const row = res.body.rows.find((r) => r.userId === builder.user.id);
      expect(row).toMatchObject({ kind: 'builder', name: 'Priya Nair', monthly: 100, addon: 0 });
      expect(row.byWorkspace).toEqual(
        expect.arrayContaining([
          { organizationId: sales.id, monthly: 60, addon: 0 },
          { organizationId: finance.id, monthly: 40, addon: 0 },
        ])
      );
      expect([...row.workspaceIds].sort()).toEqual([sales.id, finance.id].sort());
      // Unknown spenders keep their workspace split so the workspace filter can place them.
      expect(res.body.rows.find((r) => r.userId === unknownUserId)).toMatchObject({
        kind: 'unknown',
        byWorkspace: [{ organizationId: finance.id, monthly: 7, addon: 0 }],
      });
    });

    it('a workspace admin who is not a super admin gets 403', async () => {
      const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['admin'] });
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', await sessionFor(admin.user, admin.organization.id));

      expect(res.statusCode).toBe(403);
    });

    it('a builder gets their own instance-wide numbers', async () => {
      const superAdmin = await createUser(app, { email: 'super@tooljet.io', userType: 'instance', groups: ['admin'] });
      const builder = await createUser(app, {
        email: 'builder@tooljet.io',
        groups: ['builder'],
        organization: superAdmin.organization,
      });
      // 2 builders on 1,000: limit 500 each.
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }, { [builder.user.id]: 100 }));

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage/me')
        .set('tj-workspace-id', superAdmin.organization.id)
        .set('Cookie', await sessionFor(builder.user, superAdmin.organization.id));

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        enabled: true,
        monthly: { used: 100, limit: 500, left: 400 },
        addon: { used: 0, limit: 0, left: 0 },
        pool: expect.objectContaining({ aiFeaturesEnabled: true, aiPlan: 'credits', balance: 900 }),
      });
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

    it('usage endpoints are not served (404)', async () => {
      const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['admin'] });
      const cookie = await sessionFor(admin.user, admin.organization.id);

      const usage = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', cookie);
      const mine = await request(app.getHttpServer())
        .get('/api/ai/credits-usage/me')
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', cookie);

      expect(usage.statusCode).toBe(404);
      expect(mine.statusCode).toBe(404);
    });
  });
});
