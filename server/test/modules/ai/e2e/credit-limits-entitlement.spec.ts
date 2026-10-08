import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, buildTestSession, getDefaultDataSource } from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { Terms } from '@modules/licensing/interfaces/terms';
import { User } from '@entities/user.entity';
import OrganizationLicense from '@ee/licensing/configs/organization-license';
import { BASIC_PLAN_TERMS, TEAM_PLAN_TERMS_CLOUD } from '@ee/licensing/constants/PlanTerms';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';
const CUSTOMER_ID = 'cust-s15';

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

const wallet = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

/** Monthly-only spend per user; remaining = pool − Σ spend. */
function gatewayFor(ownerPath: string, pool: { monthly: number; addon: number }, spend: Record<string, number> = {}) {
  const users = Object.entries(spend).map(([userId, monthly]) => ({ userId, ...wallet(monthly) }));
  const used = users.reduce((acc, u) => acc + u.recurring, 0);
  const usage = { cycleStart: CYCLE_START, trackingSince: null, unattributed: wallet(0), pool: wallet(used) };
  return {
    [`${ownerPath}/balance`]: {
      balance: pool.monthly - used + pool.addon,
      remaining: wallet(pool.monthly - used, pool.addon),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: null },
      cycleStart: CYCLE_START,
    },
    [`${ownerPath}/usage`]: { ...usage, users },
    [`${ownerPath}/usage?groupBy=organization`]: { ...usage, users: users.map((u) => ({ ...u, byOrganization: [] })) },
  };
}

/**
 * Swaps the test licence for a real one of `type`, built the way production builds it: Cloud from the
 * organization_license terms (`OrganizationLicense`), self-hosted from a decrypted key (`LicenseBase`).
 * Team plan terms (AI on, credits) with only the type changed, so the type alone decides.
 */
function licenceOfType(app: INestApplication, edition: 'cloud' | 'ee', type: LICENSE_TYPE) {
  const lts = app.get(LicenseTermsService) as unknown as { _licenseInstance: LicenseBase };
  const terms: Partial<Terms> = {
    ...(TEAM_PLAN_TERMS_CLOUD as Partial<Terms>),
    type,
    ai: { plan: 'credits', apiKey: 'selfhost-key' },
    meta: { customerId: CUSTOMER_ID },
  } as Partial<Terms>;
  const expiry = new Date(Date.now() + 30 * 86_400_000);
  lts._licenseInstance =
    edition === 'cloud'
      ? new OrganizationLicense(terms as Terms, new Date(), expiry, 'team')
      : new (LicenseBase as unknown as new (...args: unknown[]) => LicenseBase)(
          BASIC_PLAN_TERMS,
          terms,
          new Date(),
          new Date(),
          expiry
        );
}

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

const call = (app: INestApplication, cookie: string[], organizationId: string) => ({
  get: (path: string) =>
    request(app.getHttpServer()).get(path).set('tj-workspace-id', organizationId).set('Cookie', cookie),
  put: (path: string, body: object) =>
    request(app.getHttpServer()).put(path).set('tj-workspace-id', organizationId).set('Cookie', cookie).send(body),
});

const limitRows = (organizationId: string | null) =>
  getDefaultDataSource().query(
    `SELECT pool, value, enabled FROM ai_credit_limits
      WHERE organization_id IS NOT DISTINCT FROM $1::uuid ORDER BY pool, value`,
    [organizationId]
  );

/** Default rows switched on, as an Enterprise scope would have before a downgrade. */
const limitsOnRows = (organizationId: string | null) =>
  getDefaultDataSource().query(
    `INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled)
     SELECT $1::uuid, NULL, pool, 'equal_share', NULL, true FROM (VALUES ('monthly'), ('addon')) p(pool)`,
    [organizationId]
  );

const POOL = { monthly: 1000, addon: 0 };

const TYPES: [LICENSE_TYPE, boolean][] = [
  [LICENSE_TYPE.ENTERPRISE, true],
  [LICENSE_TYPE.TRIAL, true],
  [LICENSE_TYPE.BUSINESS, false],
  [LICENSE_TYPE.BASIC, false],
];

/** @group ai */
describe('Per-builder AI credit limits are Enterprise-only', () => {
  const previous = { gateway: process.env.TJ_AI_GATEWAY_URL, features: process.env.ENABLE_AI_FEATURES };

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
  });

  afterAll(() => {
    process.env.TJ_AI_GATEWAY_URL = previous.gateway;
    process.env.ENABLE_AI_FEATURES = previous.features;
  });

  describe.each(['cloud', 'ee'] as const)('%s', (edition) => {
    let app: INestApplication;
    let original: LicenseBase;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition, plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = edition;
      original = (app.get(LicenseTermsService) as unknown as { _licenseInstance: LicenseBase })._licenseInstance;
    });

    afterEach(() => {
      jest.restoreAllMocks();
      (app.get(LicenseTermsService) as unknown as { _licenseInstance: LicenseBase })._licenseInstance = original;
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Admin (super admin self-hosted) + 1 builder = 2 builders; pool 1,000 → 500 each. */
    async function seed(prefix: string) {
      const admin = await createUser(app, {
        email: `${prefix}-${edition}-admin@tooljet.io`,
        groups: ['end-user', 'admin'],
        ...(edition === 'ee' && { userType: 'instance' }),
      });
      const workspace = admin.organization;
      const builder = (
        await createUser(app, {
          email: `${prefix}-${edition}-b@tooljet.io`,
          groups: ['builder'],
          organization: workspace,
        })
      ).user as User;
      const scope = edition === 'cloud' ? workspace.id : null;
      const owner =
        edition === 'cloud' ? `/api/ai/organizations/${workspace.id}` : `/api/ai/selfhost-customers/${CUSTOMER_ID}`;
      return {
        workspace,
        builder,
        scope,
        owner,
        asAdmin: call(app, await sessionFor(admin.user, workspace.id), workspace.id),
        asBuilder: call(app, await sessionFor(builder, workspace.id), workspace.id),
      };
    }

    it('a pool shrink on Team leaves stored limits alone (no reset, audit or notice); after an upgrade it applies once', async () => {
      const s = await seed('shrink');
      /** Balance with plan sizes, so a plan change is detectable. */
      const withPlan = (monthly: number, cycleStart: string) => {
        const routes = gatewayFor(s.owner, { monthly, addon: 0 });
        Object.assign(routes[`${s.owner}/balance`], { plan: wallet(monthly), cycleStart });
        for (const path of [`${s.owner}/usage`, `${s.owner}/usage?groupBy=organization`]) {
          Object.assign(routes[path], { cycleStart });
        }
        return routes;
      };
      const adjusted = () =>
        getDefaultDataSource().query(
          `SELECT id FROM audit_logs WHERE organization_id = $1 AND action_type = 'AI_CREDIT_LIMITS_ADJUSTED'`,
          [s.workspace.id]
        );
      const custom = () =>
        getDefaultDataSource().query(`SELECT pool, value FROM ai_credit_limits WHERE user_id = $1`, [s.builder.id]);

      // Enterprise: limits on, builder on a custom 3,000 of 10,000; the save records the plan sizes.
      licenceOfType(app, edition, LICENSE_TYPE.ENTERPRISE);
      let gateway = stubGateway(withPlan(10_000, CYCLE_START));
      expect((await s.asAdmin.put('/api/ai/credits-usage/limits', { enabled: true })).statusCode).toBe(200);
      expect(
        (await s.asAdmin.put(`/api/ai/credits-usage/limits/builders/${s.builder.id}`, { monthly: 3000 })).statusCode
      ).toBe(200);
      gateway.mockRestore();

      // Downgraded to Team, then the plan shrinks below the custom limit.
      const NEW_CYCLE = new Date(Date.now() - 3600_000).toISOString();
      licenceOfType(app, edition, LICENSE_TYPE.BUSINESS);
      gateway = stubGateway(withPlan(2003, NEW_CYCLE));
      const team = await s.asAdmin.get('/api/ai/credits-usage');

      expect(team.statusCode).toBe(200);
      expect(team.body.notices).toEqual([]);
      expect(await custom()).toEqual([{ pool: 'monthly', value: 3000 }]);
      await new Promise((r) => setTimeout(r, 500));
      expect(await adjusted()).toEqual([]);
      gateway.mockRestore();

      // Back on Enterprise: the shrink is found and applied once.
      licenceOfType(app, edition, LICENSE_TYPE.ENTERPRISE);
      stubGateway(withPlan(2003, NEW_CYCLE));
      const enterprise = await s.asAdmin.get('/api/ai/credits-usage');
      await s.asAdmin.get('/api/ai/credits-usage');

      expect(enterprise.body.notices).toHaveLength(1);
      expect(await custom()).toEqual([]);
      for (let i = 0; i < 50 && (await adjusted()).length < 1; i++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 300));
      expect(await adjusted()).toHaveLength(1);
    });

    describe.each(TYPES)('licence type %s (limits available: %s)', (type, available) => {
      it('GET usage reports the flag; a new scope (no rows) starts on only when available', async () => {
        const s = await seed(`u-${type}`);
        licenceOfType(app, edition, type);
        stubGateway(gatewayFor(s.owner, POOL));

        const res = await s.asAdmin.get('/api/ai/credits-usage');

        expect(res.statusCode).toBe(200);
        expect(res.body.limitsAvailable).toBe(available);
        expect(res.body.limits.enabled).toBe(available);
        // Pool cards and rows stay on every plan.
        expect(res.body.pools.monthly.total).toBe(1000);
        expect(res.body.rows.some((r) => r.userId === s.builder.id)).toBe(true);
      });

      it(`saves are ${available ? 'allowed' : 'refused with the licence status (451)'}`, async () => {
        const s = await seed(`p-${type}`);
        licenceOfType(app, edition, type);
        stubGateway(gatewayFor(s.owner, POOL));

        const toggle = await s.asAdmin.put('/api/ai/credits-usage/limits', { enabled: false });
        const custom = await s.asAdmin.put(`/api/ai/credits-usage/limits/builders/${s.builder.id}`, {
          monthly: 100,
          addon: null,
        });

        expect(toggle.statusCode).toBe(available ? 200 : 451);
        expect(custom.statusCode).toBe(available ? 200 : 451);
        if (!available) expect(await limitRows(s.scope)).toEqual([]);
      });

      it(`with limits switched on in the store, a builder over the limit is ${
        available ? 'refused' : 'not limited (no refusal, no run gate)'
      }; my-credits says so`, async () => {
        const s = await seed(`e-${type}`);
        licenceOfType(app, edition, type);
        await limitsOnRows(s.scope);
        const routes = gatewayFor(s.owner, POOL, { [s.builder.id]: 600 });
        stubGateway(routes);
        const balance = routes[`${s.owner}/balance`] as Parameters<BuilderUsageService['builderRefusal']>[1];

        const check = await app
          .get(BuilderUsageService)
          .builderRefusal({ id: s.builder.id, organizationId: s.workspace.id }, balance, new Date());
        const mine = await s.asBuilder.get('/api/ai/credits-usage/me');

        if (available) {
          expect(check.refusal).toBe('credit_limit_reached');
          expect(check.gate).toBeDefined();
        } else {
          expect(check).toEqual({ refusal: null });
        }
        expect(mine.statusCode).toBe(200);
        expect(mine.body.enabled).toBe(available);
      });
    });
  });
});
