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

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

// The page shows a notice only if it was detected after the current billing cycle began, so every date is in the past.
const CYCLE_START = daysAgo(10); // this billing cycle began 10 days ago, so a notice detected now is this cycle's
const NEW_CYCLE = hoursAgo(1); // the plan shrinks at a new cycle that began an hour ago; its notice is dated then
const ADDON_END = minutesAgo(1); // the add-on ran out a minute ago, inside this cycle; its notice is dated to that end

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
        // The gateway path for this workspace's wallet; stubbed answers are keyed under it.
        owner: `/api/ai/organizations/${workspace.id}`,
        adaCookie: await sessionFor(ada.user, workspace.id),
      };
    }
    type WsSales = Awaited<ReturnType<typeof seedWsSales>>;

    const getUsage = (ws: WsSales) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', ws.workspace.id)
        .set('Cookie', ws.adaCookie);

    const getMine = async (ws: WsSales, user: User) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage/me')
        .set('tj-workspace-id', ws.workspace.id)
        .set('Cookie', await sessionFor(user, ws.workspace.id));

    const putBuilderLimit = (ws: WsSales, user: User, body: object) =>
      request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${user.id}`)
        .set('tj-workspace-id', ws.workspace.id)
        .set('Cookie', ws.adaCookie)
        .send(body);

    /** The cheapest AI action: autosort, with the agent stubbed so a started action finishes at once. */
    const autosort = async (ws: WsSales, user: User) =>
      request(app.getHttpServer())
        .post('/api/ai/autosort')
        .set('tj-workspace-id', ws.workspace.id)
        .set('Cookie', await sessionFor(user, ws.workspace.id))
        .send({ queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] });

    const stubAgents = () => {
      const util = (app.get(AiController) as unknown as { aiService: { aiUtilService: AiUtilService } }).aiService
        .aiUtilService;
      jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [] }]);
    };

    const rowOf = (res: request.Response, user: User) => res.body.rows.find((r) => r.userId === user.id);

    describe('a workspace on the enterprise plan gets a pool', () => {
      it('should show the monthly and add-on pools and every builder', async () => {
        const ws = await seedWsSales();
        stubGateway(
          gatewayFor(
            ws.owner,
            { monthly: 10_000, addon: 2000 },
            { [ws.priya.id]: 1200 },
            { addonSpend: { [ws.omar.id]: 300 } }
          )
        );

        const res = await getUsage(ws);

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

    describe('limits start on with an equal share', () => {
      it('should give each of 4 builders 2,500 monthly and 500 add-on', async () => {
        const ws = await seedWsSales();
        stubGateway(gatewayFor(ws.owner, { monthly: 10_000, addon: 2000 }));

        const res = await getUsage(ws);

        // 10,000 ÷ 4 = 2,500 monthly; 2,000 ÷ 4 = 500 add-on.
        expect(res.body.limits).toMatchObject({
          enabled: true,
          builderCount: 4,
          monthly: { mode: 'equal_share', effective: 2500 },
          addon: { mode: 'equal_share', effective: 500 },
        });
        expect(rowOf(res, ws.priya).limit).toEqual({ monthly: 2500, addon: 500 });
      });
    });

    describe('a builder sees their own credits', () => {
      it('should count spend against the monthly limit first', async () => {
        const ws = await seedWsSales();
        // Priya was billed 2,200 from the monthly wallet and 100 from the add-on wallet: 2,300 in total.
        stubGateway(
          gatewayFor(
            ws.owner,
            { monthly: 10_000, addon: 2000 },
            { [ws.priya.id]: 2200 },
            { addonSpend: { [ws.priya.id]: 100 } }
          )
        );

        const res = await getMine(ws, ws.priya);

        // All 2,300 fits her 2,500 monthly limit, so all of it counts as monthly; her add-on is untouched.
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          enabled: true,
          monthly: { used: 2300, limit: 2500, left: 200 },
          addon: { used: 0, limit: 500, left: 500 },
        });
      });
    });

    describe('buying an add-on grows the add-on pool', () => {
      it("should raise the add-on equal share, keep Omar's custom limit and show no notice", async () => {
        const ws = await seedWsSales();
        const routes = gatewayFor(
          ws.owner,
          { monthly: 10_000, addon: 2000 },
          {},
          { plan: { monthly: 10_000, addon: 2000 }, cycleStart: CYCLE_START }
        );
        stubGateway(routes);
        await putBuilderLimit(ws, ws.omar, { monthly: 4000, addon: 800 }).expect(200);
        const before = await getUsage(ws);

        // A 2,000 add-on is bought: the add-on wallet grows to 4,000. Assigning onto `routes` changes what the stubbed
        // gateway answers from here on.
        Object.assign(
          routes,
          gatewayFor(
            ws.owner,
            { monthly: 10_000, addon: 4000 },
            {},
            { plan: { monthly: 10_000, addon: 4000 }, cycleStart: CYCLE_START }
          )
        );
        const after = await getUsage(ws);

        // The 3 others share what Omar's 800 leaves: (2,000 − 800) ÷ 3 = 400, then (4,000 − 800) ÷ 3 = 1,066.
        expect(before.body.limits.addon.effective).toBe(400);
        expect(after.body.limits.addon.effective).toBe(1066);
        expect(rowOf(after, ws.omar).limit).toEqual({ monthly: 4000, addon: 800 });
        expect(after.body.notices).toEqual([]);
        expect(await auditRows(ws.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 0)).toEqual([]);
      });
    });

    describe('a builder joins after a seat is bought', () => {
      it('should keep the default share when the pool grows by 2,000 for the new builder', async () => {
        const ws = await seedWsSales();
        await createUser(app, { email: 'mei@tooljet.io', groups: ['builder'], organization: ws.workspace });
        const routes = gatewayFor(
          ws.owner,
          { monthly: 10_000, addon: 0 },
          {},
          { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
        );
        stubGateway(routes);
        const before = await getUsage(ws);

        // A seat is bought: the plan and balance grow to 12,000 and the cycle restarts, so nothing is spent yet.
        Object.assign(
          routes,
          gatewayFor(
            ws.owner,
            { monthly: 12_000, addon: 0 },
            {},
            { plan: { monthly: 12_000, addon: 0 }, cycleStart: NEW_CYCLE }
          )
        );
        await createUser(app, {
          email: 'kenji@tooljet.io',
          groups: ['builder'],
          organization: ws.workspace,
          status: 'invited',
        });
        const after = await getUsage(ws);

        // 10,000 ÷ 5 = 2,000; then 12,000 ÷ 6 = 2,000.
        expect(before.body.limits).toMatchObject({
          builderCount: 5,
          monthly: { mode: 'equal_share', effective: 2000 },
        });
        expect(after.body.limits).toMatchObject({
          builderCount: 6,
          monthly: { mode: 'equal_share', effective: 2000 },
        });
        expect(after.body.notices).toEqual([]);
      });
    });

    describe("a refund lowers a builder's spend", () => {
      it('should give Priya back the refunded credits', async () => {
        const ws = await seedWsSales();
        const routes = gatewayFor(ws.owner, { monthly: 10_000, addon: 2000 }, { [ws.priya.id]: 2000 });
        stubGateway(routes);
        const before = await getMine(ws, ws.priya);

        // A failed action refunds 300: the gateway reports spend net of the credit row, 2,000 − 300 = 1,700.
        Object.assign(routes, gatewayFor(ws.owner, { monthly: 10_000, addon: 2000 }, { [ws.priya.id]: 1700 }));
        const after = await getMine(ws, ws.priya);

        expect(before.body.monthly).toMatchObject({ used: 2000, left: 500 });
        expect(after.body.monthly).toMatchObject({ used: 1700, left: 800 });
      });
    });

    describe('a builder at their limit is stopped', () => {
      it('should refuse Priya with 402 credit_limit_reached and still let Omar act', async () => {
        const ws = await seedWsSales();
        stubAgents();
        // Priya spent 3,000: her whole limit (2,500 monthly + 500 add-on). Omar spent nothing.
        stubGateway(gatewayFor(ws.owner, { monthly: 10_000, addon: 2000 }, { [ws.priya.id]: 3000 }));

        const priya = await autosort(ws, ws.priya);
        const omar = await autosort(ws, ws.omar);

        expect(priya.statusCode).toBe(402);
        expect(priya.body.code).toBe('credit_limit_reached');
        expect(omar.statusCode).toBe(201);
      });
    });

    describe("an admin raises one builder's limit", () => {
      it("should let Priya act again and lower the others' equal share", async () => {
        const ws = await seedWsSales();
        stubAgents();
        stubGateway(gatewayFor(ws.owner, { monthly: 10_000, addon: 2000 }, { [ws.priya.id]: 3000 }));

        const atLimit = await autosort(ws, ws.priya);
        await putBuilderLimit(ws, ws.priya, { monthly: 4000 }).expect(200);
        const raised = await autosort(ws, ws.priya);
        const usage = await getUsage(ws);

        expect(atLimit.statusCode).toBe(402);
        // Her limit is now 4,000 monthly + 500 add-on = 4,500, over her 3,000 spent.
        expect(raised.statusCode).toBe(201);
        // The 3 others share what is left: (10,000 − 4,000) ÷ 3 = 2,000 each, down from 2,500.
        expect(usage.body.limits.monthly.effective).toBe(2000);
      });
    });

    describe('the add-on expires', () => {
      it('should drop add-on limits only, with a notice and an AI_CREDIT_LIMITS_ADJUSTED audit entry', async () => {
        const ws = await seedWsSales();
        const routes = gatewayFor(
          ws.owner,
          { monthly: 10_000, addon: 2000 },
          {},
          { plan: { monthly: 10_000, addon: 2000 }, cycleStart: CYCLE_START, addonEndsAt: ADDON_END }
        );
        stubGateway(routes);
        await putBuilderLimit(ws, ws.omar, { monthly: 4000, addon: 800 }).expect(200);

        // The add-on wallet expires: plan and balance go to 0 add-on.
        Object.assign(
          routes,
          gatewayFor(
            ws.owner,
            { monthly: 10_000, addon: 0 },
            {},
            { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
          )
        );
        const res = await getUsage(ws);

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
        expect(rowOf(res, ws.omar).limit).toEqual({ monthly: 4000, addon: 0 });
        expect(rowOf(res, ws.priya).limit).toEqual({ monthly: 2000, addon: 0 });
        expect(await auditRows(ws.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toEqual([
          { userId: null, metadata: expect.objectContaining({ reason: 'addon_expiry', customReduced: 1 }) },
        ]);
      });
    });

    describe('the plan shrinks', () => {
      it('should reset the largest custom limit that no longer fits to the default, with a notice', async () => {
        const ws = await seedWsSales();
        const routes = gatewayFor(
          ws.owner,
          { monthly: 10_000, addon: 0 },
          {},
          { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
        );
        stubGateway(routes);
        await putBuilderLimit(ws, ws.priya, { monthly: 4000 }).expect(200);
        await putBuilderLimit(ws, ws.omar, { monthly: 3000 }).expect(200);

        // The plan drops to 6,000 monthly at a new cycle.
        Object.assign(
          routes,
          gatewayFor(
            ws.owner,
            { monthly: 6000, addon: 0 },
            {},
            { plan: { monthly: 6000, addon: 0 }, cycleStart: NEW_CYCLE }
          )
        );
        const res = await getUsage(ws);

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
        expect(rowOf(res, ws.priya).customLimit).toBeUndefined();
        expect(rowOf(res, ws.priya).limit.monthly).toBe(1000);
        expect(rowOf(res, ws.omar).limit.monthly).toBe(3000);
      });
    });

    describe('the shared pool runs dry', () => {
      it('should refuse every builder with 402 pool_empty', async () => {
        const ws = await seedWsSales();
        stubAgents();
        // Priya and Omar overshot their limits (actions in flight always finish) and spent the whole 10,000.
        // Ada and Lee spent nothing, but there is nothing left to spend.
        stubGateway(gatewayFor(ws.owner, { monthly: 10_000, addon: 0 }, { [ws.priya.id]: 5000, [ws.omar.id]: 5000 }));

        const results = [];
        for (const user of [ws.ada, ws.priya, ws.omar, ws.lee]) results.push(await autosort(ws, user));

        for (const res of results) {
          expect(res.statusCode).toBe(402);
          expect(res.body).toMatchObject({
            code: 'pool_empty',
            message: 'Your workspace is out of AI credits. Ask your admin to add more.',
          });
        }
      });
    });

    describe('on the team plan', () => {
      it('should show usage with limitsAvailable false and refuse saving limits with 451', async () => {
        const ws = await seedWsSales();
        restoreLicence = useLicence(app, TEAM_TERMS);
        stubGateway(gatewayFor(ws.owner, { monthly: 10_000, addon: 0 }, { [ws.priya.id]: 1200 }));

        const usage = await getUsage(ws);
        const save = await request(app.getHttpServer())
          .put('/api/ai/credits-usage/limits')
          .set('tj-workspace-id', ws.workspace.id)
          .set('Cookie', ws.adaCookie)
          .send({ enabled: true });

        expect(usage.statusCode).toBe(200);
        expect(usage.body).toMatchObject({ limitsAvailable: false, limits: { enabled: false } });
        expect(rowOf(usage, ws.priya)).toMatchObject({ monthly: 1200 });
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
