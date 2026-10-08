// Read this first: per-builder AI credit limits told as one workspace's story. Each chapter stands alone.
// The gateway (the money) is stubbed with literal wallet numbers; the money mechanics themselves are verified in
// the AI gateway repo's lifecycle.db.test.ts. Code map: server/ee/ai/AGENTS.md. This file intentionally overlaps
// the contract specs (credits-usage, credit-limits, credit-enforcement, pool-change) on happy paths and asserts
// headline numbers only.
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  GATEWAY,
  SELF_HOSTED_CUSTOMER,
  SELF_HOSTED_TERMS,
  TEAM_TERMS,
  auditRows,
  gatewayFor,
  sessionFor,
  stubGateway,
  useLicence,
} from 'test-helper';
import { User } from '@entities/user.entity';
import { AiController } from '@ee/ai/controller';
import { AiUtilService } from '@ee/ai/util.service';

// Notices show only when found in the current cycle, so cycles start in the past.
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const CYCLE_START = ago(10 * 24 * 3600_000);
const NEW_CYCLE = ago(3600_000);
const ADDON_END = ago(60_000);

/** @group ai */
describe('AI credit limits: lifecycle of a workspace pool', () => {
  const ENV_KEYS = ['TJ_AI_GATEWAY_URL', 'ENABLE_AI_FEATURES', 'TOOLJET_EDITION'];
  const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
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

    /** ws-sales: Ada (admin, counts as a builder), Priya, Omar and Lee. 4 builders share the pool. */
    async function seedWsSales() {
      const ada = await createUser(app, { email: 'ada@tooljet.io', groups: ['admin'], organizationName: 'ws-sales' });
      const workspace = ada.organization;
      const builder = async (name: string) =>
        (await createUser(app, { email: `${name}@tooljet.io`, groups: ['builder'], organization: workspace }))
          .user as User;
      return {
        workspace,
        ada: ada.user as User,
        priya: await builder('priya'),
        omar: await builder('omar'),
        lee: await builder('lee'),
        owner: `/api/ai/organizations/${workspace.id}`,
        adaCookie: await sessionFor(ada.user, workspace.id),
      };
    }
    type WsSales = Awaited<ReturnType<typeof seedWsSales>>;

    const getUsage = (s: WsSales) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.adaCookie);

    const getMine = async (s: WsSales, user: User) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage/me')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', await sessionFor(user, s.workspace.id));

    const putBuilderLimit = (s: WsSales, user: User, body: object) =>
      request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${user.id}`)
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.adaCookie)
        .send(body);

    /** The cheapest AI action: autosort, with the agent stubbed so a started action finishes at once. */
    const autosort = async (s: WsSales, user: User) =>
      request(app.getHttpServer())
        .post('/api/ai/autosort')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', await sessionFor(user, s.workspace.id))
        .send({ queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] });

    const stubAgents = () => {
      const util = (app.get(AiController) as unknown as { aiService: { aiUtilService: AiUtilService } }).aiService
        .aiUtilService;
      jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [] }]);
    };

    const rowOf = (res: request.Response, user: User) => res.body.rows.find((r) => r.userId === user.id);

    describe('1. a workspace on the enterprise plan gets a pool', () => {
      it('should show the monthly and add-on pools and every builder', async () => {
        const s = await seedWsSales();
        stubGateway(
          gatewayFor(
            s.owner,
            { monthly: 10_000, addon: 2000 },
            { [s.priya.id]: 1200 },
            { addonSpend: { [s.omar.id]: 300 } }
          )
        );

        const res = await getUsage(s);

        expect(res.statusCode).toBe(200);
        // A pool is what is left plus what was spent this cycle: 8,800 + 1,200 and 1,700 + 300.
        expect(res.body.pools.monthly).toMatchObject({ total: 10_000, remaining: 8800, used: 1200 });
        expect(res.body.pools.addon).toMatchObject({ total: 2000, remaining: 1700, used: 300 });
        expect(
          res.body.rows
            .filter((r) => r.kind === 'builder')
            .map((r) => r.email)
            .sort()
        ).toEqual(['ada@tooljet.io', 'lee@tooljet.io', 'omar@tooljet.io', 'priya@tooljet.io']);
      });
    });

    describe('2. limits start on with an equal share', () => {
      it('should give each of 4 builders 2,500 monthly and 500 add-on', async () => {
        const s = await seedWsSales();
        stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 2000 }));

        const res = await getUsage(s);

        // 10,000 ÷ 4 = 2,500 monthly; 2,000 ÷ 4 = 500 add-on.
        expect(res.body.limits).toMatchObject({
          enabled: true,
          builderCount: 4,
          monthly: { mode: 'equal_share', effective: 2500 },
          addon: { mode: 'equal_share', effective: 500 },
        });
        expect(rowOf(res, s.priya).limit).toEqual({ monthly: 2500, addon: 500 });
      });
    });

    describe('3. a builder sees their own credits', () => {
      it('should count spend against the monthly limit first', async () => {
        const s = await seedWsSales();
        // Priya was billed 2,200 from the monthly wallet and 100 from the add-on wallet: 2,300 in total.
        stubGateway(
          gatewayFor(
            s.owner,
            { monthly: 10_000, addon: 2000 },
            { [s.priya.id]: 2200 },
            { addonSpend: { [s.priya.id]: 100 } }
          )
        );

        const res = await getMine(s, s.priya);

        // All 2,300 fits her 2,500 monthly limit, so all of it counts as monthly; her add-on is untouched.
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          enabled: true,
          monthly: { used: 2300, limit: 2500, left: 200 },
          addon: { used: 0, limit: 500, left: 500 },
        });
      });
    });

    describe('4. buying an add-on grows the add-on pool', () => {
      it("should raise the add-on equal share, keep Omar's custom limit and show no notice", async () => {
        const s = await seedWsSales();
        const routes = gatewayFor(
          s.owner,
          { monthly: 10_000, addon: 2000 },
          {},
          { plan: { monthly: 10_000, addon: 2000 }, cycleStart: CYCLE_START }
        );
        stubGateway(routes);
        await putBuilderLimit(s, s.omar, { monthly: 4000, addon: 800 }).expect(200);
        const before = await getUsage(s);

        // A 2,000 add-on is bought: the add-on wallet grows to 4,000.
        Object.assign(
          routes,
          gatewayFor(
            s.owner,
            { monthly: 10_000, addon: 4000 },
            {},
            { plan: { monthly: 10_000, addon: 4000 }, cycleStart: CYCLE_START }
          )
        );
        const after = await getUsage(s);

        // The 3 others share what Omar's 800 leaves: (2,000 − 800) ÷ 3 = 400, then (4,000 − 800) ÷ 3 = 1,066.
        expect(before.body.limits.addon.effective).toBe(400);
        expect(after.body.limits.addon.effective).toBe(1066);
        expect(rowOf(after, s.omar).limit).toEqual({ monthly: 4000, addon: 800 });
        expect(after.body.notices).toEqual([]);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 0)).toEqual([]);
      });
    });

    describe("5. a refund lowers a builder's spend", () => {
      it('should give Priya back the refunded credits', async () => {
        const s = await seedWsSales();
        const routes = gatewayFor(s.owner, { monthly: 10_000, addon: 2000 }, { [s.priya.id]: 2000 });
        stubGateway(routes);
        const before = await getMine(s, s.priya);

        // A failed action refunds 300: the gateway reports spend net of the credit row, 2,000 − 300 = 1,700.
        Object.assign(routes, gatewayFor(s.owner, { monthly: 10_000, addon: 2000 }, { [s.priya.id]: 1700 }));
        const after = await getMine(s, s.priya);

        expect(before.body.monthly).toMatchObject({ used: 2000, left: 500 });
        expect(after.body.monthly).toMatchObject({ used: 1700, left: 800 });
      });
    });

    describe('6. a builder at their limit is stopped', () => {
      it('should refuse Priya with 402 credit_limit_reached and still let Omar act', async () => {
        const s = await seedWsSales();
        stubAgents();
        // Priya spent 3,000: her whole limit (2,500 monthly + 500 add-on). Omar spent nothing.
        stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 2000 }, { [s.priya.id]: 3000 }));

        const priya = await autosort(s, s.priya);
        const omar = await autosort(s, s.omar);

        expect(priya.statusCode).toBe(402);
        expect(priya.body.code).toBe('credit_limit_reached');
        expect(omar.statusCode).toBe(201);
      });
    });

    describe("7. an admin raises one builder's limit", () => {
      it("should let Priya act again and lower the others' equal share", async () => {
        const s = await seedWsSales();
        stubAgents();
        stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 2000 }, { [s.priya.id]: 3000 }));

        const atLimit = await autosort(s, s.priya);
        await putBuilderLimit(s, s.priya, { monthly: 4000 }).expect(200);
        const raised = await autosort(s, s.priya);
        const usage = await getUsage(s);

        expect(atLimit.statusCode).toBe(402);
        // Her limit is now 4,000 monthly + 500 add-on = 4,500, over her 3,000 spent.
        expect(raised.statusCode).toBe(201);
        // The 3 others share what is left: (10,000 − 4,000) ÷ 3 = 2,000 each, down from 2,500.
        expect(usage.body.limits.monthly.effective).toBe(2000);
      });
    });

    describe('8. the add-on expires', () => {
      it('should drop add-on limits only, with a notice and an AI_CREDIT_LIMITS_ADJUSTED audit entry', async () => {
        const s = await seedWsSales();
        const routes = gatewayFor(
          s.owner,
          { monthly: 10_000, addon: 2000 },
          {},
          { plan: { monthly: 10_000, addon: 2000 }, cycleStart: CYCLE_START, addonEndsAt: ADDON_END }
        );
        stubGateway(routes);
        await putBuilderLimit(s, s.omar, { monthly: 4000, addon: 800 }).expect(200);

        // The add-on wallet expires: plan and balance go to 0 add-on.
        Object.assign(
          routes,
          gatewayFor(
            s.owner,
            { monthly: 10_000, addon: 0 },
            {},
            { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
          )
        );
        const res = await getUsage(s);

        // Add-on default: (2,000 − 800) ÷ 3 = 400 before, 0 after. Omar's custom 800 no longer fits and is reset.
        expect(res.body.notices).toEqual([
          {
            kind: 'addon_expiry',
            on: ADDON_END,
            detectedAt: expect.any(String),
            defaults: { addon: { before: 400, after: 0 } },
            reduced: 1,
          },
        ]);
        // Monthly is untouched: Omar keeps his custom 4,000; the others keep (10,000 − 4,000) ÷ 3 = 2,000.
        expect(rowOf(res, s.omar).limit).toEqual({ monthly: 4000, addon: 0 });
        expect(rowOf(res, s.priya).limit).toEqual({ monthly: 2000, addon: 0 });
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toEqual([
          { userId: null, metadata: expect.objectContaining({ reason: 'addon_expiry', customReduced: 1 }) },
        ]);
      });
    });

    describe('9. the plan shrinks', () => {
      it('should reset the largest custom limit that no longer fits to the default, with a notice', async () => {
        const s = await seedWsSales();
        const routes = gatewayFor(
          s.owner,
          { monthly: 10_000, addon: 0 },
          {},
          { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
        );
        stubGateway(routes);
        await putBuilderLimit(s, s.priya, { monthly: 4000 }).expect(200);
        await putBuilderLimit(s, s.omar, { monthly: 3000 }).expect(200);

        // The plan drops to 6,000 monthly at a new cycle.
        Object.assign(
          routes,
          gatewayFor(
            s.owner,
            { monthly: 6000, addon: 0 },
            {},
            { plan: { monthly: 6000, addon: 0 }, cycleStart: NEW_CYCLE }
          )
        );
        const res = await getUsage(s);

        // Together 4,000 + 3,000 = 7,000 no longer fit 6,000. Priya's 4,000 is the largest, so it goes first.
        // That leaves room for Omar's 3,000, which stays.
        // Default: (10,000 − 7,000) ÷ 2 = 1,500 before; (6,000 − 3,000) ÷ 3 = 1,000 after.
        expect(res.body.notices).toEqual([
          {
            kind: 'plan_change',
            on: NEW_CYCLE,
            detectedAt: expect.any(String),
            defaults: { monthly: { before: 1500, after: 1000 } },
            reduced: 1,
          },
        ]);
        expect(rowOf(res, s.priya).customLimit).toBeUndefined();
        expect(rowOf(res, s.priya).limit.monthly).toBe(1000);
        expect(rowOf(res, s.omar).limit.monthly).toBe(3000);
      });
    });

    describe('10. the shared pool runs dry', () => {
      it('should refuse every builder with 402 pool_empty', async () => {
        const s = await seedWsSales();
        stubAgents();
        // Priya and Omar overshot their limits (actions in flight always finish) and spent the whole 10,000.
        // Ada and Lee spent nothing, but there is nothing left to spend.
        stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 0 }, { [s.priya.id]: 5000, [s.omar.id]: 5000 }));

        const results = [];
        for (const user of [s.ada, s.priya, s.omar, s.lee]) results.push(await autosort(s, user));

        for (const res of results) {
          expect(res.statusCode).toBe(402);
          expect(res.body).toMatchObject({
            code: 'pool_empty',
            message: 'Your workspace is out of AI credits. Ask your admin to add more.',
          });
        }
      });
    });

    describe('11. on the team plan', () => {
      it('should show usage with limitsAvailable false and refuse saving limits with 451', async () => {
        const s = await seedWsSales();
        restoreLicence = useLicence(app, TEAM_TERMS);
        stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 0 }, { [s.priya.id]: 1200 }));

        const usage = await getUsage(s);
        const save = await request(app.getHttpServer())
          .put('/api/ai/credits-usage/limits')
          .set('tj-workspace-id', s.workspace.id)
          .set('Cookie', s.adaCookie)
          .send({ enabled: true });

        expect(usage.statusCode).toBe(200);
        expect(usage.body).toMatchObject({ limitsAvailable: false, limits: { enabled: false } });
        expect(rowOf(usage, s.priya)).toMatchObject({ monthly: 1200 });
        expect(save.statusCode).toBe(451);
      });
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    let restoreLicence: () => void;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
      restoreLicence = useLicence(app, SELF_HOSTED_TERMS);
    });

    afterAll(async () => {
      restoreLicence();
      await closeTestApp(app);
    }, 60_000);

    describe('one pool for the whole instance', () => {
      it("should share it equally across every workspace's builders", async () => {
        const ada = await createUser(app, {
          email: 'ada@tooljet.io',
          userType: 'instance',
          groups: ['admin'],
          organizationName: 'ws-sales',
        });
        await createUser(app, { email: 'fatima@tooljet.io', groups: ['admin'], organizationName: 'ws-finance' });
        stubGateway(gatewayFor(`/api/ai/selfhost-customers/${SELF_HOSTED_CUSTOMER}`, { monthly: 10_000, addon: 0 }));

        const res = await request(app.getHttpServer())
          .get('/api/ai/credits-usage')
          .set('tj-workspace-id', ada.organization.id)
          .set('Cookie', await sessionFor(ada.user, ada.organization.id));

        // Ada (super admin, ws-sales) and Fatima (admin, ws-finance) share the licence's pool: 10,000 ÷ 2 = 5,000.
        expect(res.statusCode).toBe(200);
        expect(res.body.limits).toMatchObject({ enabled: true, builderCount: 2, monthly: { effective: 5000 } });
      });
    });
  });
});
