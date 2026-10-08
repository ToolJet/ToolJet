import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createUser, getDefaultDataSource, withRealTransactions } from 'test-helper';
import { User } from '@entities/user.entity';
import { AiController } from '@ee/ai/controller';
import { AiUtilService } from '@ee/ai/util.service';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';
import {
  GATEWAY,
  SELF_HOSTED_CUSTOMER,
  SELF_HOSTED_TERMS,
  TEAM_TERMS,
  auditRows,
  dropSeed,
  gatewayFor,
  sessionFor,
  stubGateway,
  useLicence,
} from './credits-gateway';

// Notices show only when found in the current cycle, so cycles start in the past.
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const CYCLE_START = ago(10 * 24 * 3600_000);
const NEW_CYCLE = ago(3600_000);
const ADDON_END = ago(60_000);

const customRows = (userId: string) =>
  getDefaultDataSource().query('SELECT pool, value FROM ai_credit_limits WHERE user_id = $1 ORDER BY pool', [userId]);

/** @group ai */
describe('AI credit limits adjust when the pool shrinks', () => {
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

    /**
     * Admin + 3 builders = 4 builders on a 10,000 monthly plan; builder 1 holds a custom 3,000, so the others get
     * (10,000 − 3,000) ÷ 3 = 2,333. The save records the plan sizes.
     */
    async function seed(name: string, addon = 0) {
      const admin = await createUser(app, { email: `${name}-admin@tooljet.io`, groups: ['admin'] });
      const workspace = admin.organization;
      const builders: User[] = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          (await createUser(app, { email: `${name}-b${n}@tooljet.io`, groups: ['builder'], organization: workspace }))
            .user as User
        );
      }
      const owner = `/api/ai/organizations/${workspace.id}`;
      const cookie = await sessionFor(admin.user, workspace.id);
      const pool = { monthly: 10_000, addon };
      const gateway = stubGateway(
        gatewayFor(owner, pool, {}, { plan: pool, cycleStart: CYCLE_START, addonEndsAt: addon ? ADDON_END : null })
      );
      await request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${builders[0].id}`)
        .set('tj-workspace-id', workspace.id)
        .set('Cookie', cookie)
        .send({ monthly: 3000, addon: addon ? 1500 : null })
        .expect(200);
      gateway.mockRestore();
      return { workspace, builders, owner, cookie, userIds: [admin.user.id, ...builders.map((b) => b.id)] };
    }

    /** The plan dropped to 2,003 at a new cycle: builder 1 may now hold 2,003 − 3 × 1 = 2,000. */
    const smallerPlan = (owner: string, spend: Record<string, number> = {}) =>
      gatewayFor(owner, { monthly: 2003, addon: 0 }, spend, {
        plan: { monthly: 2003, addon: 0 },
        cycleStart: NEW_CYCLE,
      });

    const getUsage = (cookie: string[], organizationId: string) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie);

    const copilot = (cookie: string[], organizationId: string) =>
      request(app.getHttpServer())
        .post('/api/ai/copilot')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send({ prompt: 'sum', context: '', language: 'javascript' });

    const stubAgents = () => {
      const util = (app.get(AiController) as unknown as { aiService: { aiUtilService: AiUtilService } }).aiService
        .aiUtilService;
      jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [], code: '' }]);
    };

    it('a plan change that drops the max to 2,000 resets a 3,000 custom limit to the default, audited as the system, with a notice on every read', async () => {
      const s = await seed('sales');
      stubGateway(smallerPlan(s.owner));

      const first = await getUsage(s.cookie, s.workspace.id);
      const second = await getUsage(s.cookie, s.workspace.id);

      expect(first.statusCode).toBe(200);
      const notice = {
        kind: 'plan_change',
        on: NEW_CYCLE,
        detectedAt: expect.any(String),
        defaults: { monthly: { before: 2333, after: 500 } },
        reduced: 1,
      };
      expect(first.body.notices).toEqual([notice]);
      expect(second.body.notices).toEqual([notice]);
      const row = first.body.rows.find((r) => r.userId === s.builders[0].id);
      expect(row.customLimit).toBeUndefined();
      expect(row.limit.monthly).toBe(500);
      expect(await customRows(s.builders[0].id)).toEqual([]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toEqual([
        {
          userId: null,
          metadata: expect.objectContaining({
            reason: 'plan_change',
            defaults: { monthly: { before: 2333, after: 500 } },
            customReduced: 1,
            builders: [
              {
                builderId: s.builders[0].id,
                builderEmail: 'sales-b1@tooljet.io',
                pool: 'monthly',
                before: 3000,
                after: null,
              },
            ],
          }),
        },
      ]);
    });

    it('a renewal that only carries in overdraft changes no limit and shows no notice', async () => {
      const s = await seed('sales');
      // Same plan; 9,000 overdraft carried in, so the new cycle starts with 1,000.
      stubGateway(
        gatewayFor(
          s.owner,
          { monthly: 1000, addon: 0 },
          {},
          { plan: { monthly: 10_000, addon: 0 }, cycleStart: NEW_CYCLE }
        )
      );

      const res = await getUsage(s.cookie, s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body.notices).toEqual([]);
      expect(await customRows(s.builders[0].id)).toEqual([{ pool: 'monthly', value: 3000 }]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 0)).toEqual([]);
    });

    it('an add-on expiry lowers add-on limits only, dated by the expiry', async () => {
      // Builder 1 holds 3,000 monthly and 1,500 of a 2,000 add-on; the others get 500 ÷ 3 = 166 add-on.
      const s = await seed('sales', 2000);
      stubGateway(gatewayFor(s.owner, { monthly: 10_000, addon: 0 }, {}, { plan: { monthly: 10_000, addon: 0 } }));

      const res = await getUsage(s.cookie, s.workspace.id);

      expect(res.body.notices).toEqual([
        {
          kind: 'addon_expiry',
          on: ADDON_END,
          detectedAt: expect.any(String),
          defaults: { addon: { before: 166, after: 0 } },
          reduced: 1,
        },
      ]);
      expect(await customRows(s.builders[0].id)).toEqual([{ pool: 'monthly', value: 3000 }]);
    });

    it('a save after a shrink adjusts the limits first, audited as the system', async () => {
      const s = await seed('sales');
      stubGateway(smallerPlan(s.owner));

      // Without the adjustment builder 1's 3,000 would make any custom default over the max.
      const res = await request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.cookie)
        .send({ defaults: { monthly: { mode: 'custom', value: 500 }, addon: { mode: 'equal_share' } } });

      expect(res.statusCode).toBe(200);
      expect(await customRows(s.builders[0].id)).toEqual([]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toEqual([
        { userId: null, metadata: expect.objectContaining({ reason: 'plan_change', customReduced: 1 }) },
      ]);
    });

    // No dashboard read in between: the spend check itself finds the shrink.
    it('the first AI action after a plan change is checked against the adjusted limit', async () => {
      const s = await seed('sales');
      const builder = s.builders[0];
      stubAgents();
      // 600 spent: under the old 3,000, over the new default of 500.
      stubGateway(smallerPlan(s.owner, { [builder.id]: 600 }));

      const res = await copilot(await sessionFor(builder, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(402);
      expect(res.body.code).toBe('credit_limit_reached');
      expect(await customRows(builder.id)).toEqual([]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
    });

    it("a builder's own credits after a plan change show the adjusted limit", async () => {
      const s = await seed('sales');
      const builder = s.builders[0];
      stubGateway(smallerPlan(s.owner));

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage/me')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', await sessionFor(builder, s.workspace.id));

      expect(res.statusCode).toBe(200);
      expect(res.body.monthly).toMatchObject({ used: 0, limit: 500, left: 500 });
      expect(await customRows(builder.id)).toEqual([]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
    });

    it('a read holding an older balance does not write it back over a newer one', async () => {
      const s = await seed('sales');
      const builder = s.builders[0];
      stubAgents();
      const usageService = (app.get(AiController) as unknown as { builderUsageService: BuilderUsageService })
        .builderUsageService;
      // Long enough for the dashboard read below to finish while the action waits on its balance.
      jest.replaceProperty(usageService, 'spendCheckTimeoutMs', 10_000);
      const older = gatewayFor(s.owner, { monthly: 10_000, addon: 0 }, {}, { plan: { monthly: 10_000, addon: 0 } });
      const newer = smallerPlan(s.owner);
      let olderAsked: () => void;
      const asked = new Promise<void>((resolve) => (olderAsked = resolve));
      let releaseOlder: () => void;
      const released = new Promise<void>((resolve) => (releaseOlder = resolve));
      let balanceReads = 0;
      stubGateway({
        ...newer,
        // The first balance read is answered late, with the balance from before the plan change.
        [`${s.owner}/balance`]: async () => {
          if (++balanceReads > 1) return newer[`${s.owner}/balance`];
          olderAsked();
          await released;
          return older[`${s.owner}/balance`];
        },
      });

      // An AI action reads the balance just before the plan change lands...
      const action = copilot(await sessionFor(builder, s.workspace.id), s.workspace.id).then((res) => res);
      await asked;
      // ...a dashboard read sees the smaller plan and adjusts...
      await getUsage(s.cookie, s.workspace.id).expect(200);
      // ...then the action's older balance arrives, and another read follows.
      releaseOlder();
      await action;
      await getUsage(s.cookie, s.workspace.id).expect(200);

      // Writing the older 10,000 back would make the next read find the shrink again and log it twice.
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
    });

    // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
    it('two reads detecting the same shrink adjust once and log once', async () => {
      await withRealTransactions(async () => {
        const s = await seed(`race-${uuidv4().slice(0, 6)}`);
        try {
          stubGateway(smallerPlan(s.owner));

          const results = await Promise.all([
            getUsage(s.cookie, s.workspace.id),
            getUsage(s.cookie, s.workspace.id),
            getUsage(s.cookie, s.workspace.id),
          ]);

          expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200]);
          expect(await customRows(s.builders[0].id)).toEqual([]);
          expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
        } finally {
          await dropSeed(s.workspace.id, s.userIds);
        }
      });
    });

    it('on a Team licence a shrink leaves limits alone; after an upgrade it is applied once', async () => {
      const s = await seed('team');
      stubGateway(smallerPlan(s.owner));

      restoreLicence = useLicence(app, TEAM_TERMS);
      const team = await getUsage(s.cookie, s.workspace.id);
      const rowsOnTeam = await customRows(s.builders[0].id);
      const auditOnTeam = await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 0);
      restoreLicence();
      const enterprise = await getUsage(s.cookie, s.workspace.id);
      await getUsage(s.cookie, s.workspace.id);

      expect(team.statusCode).toBe(200);
      expect(team.body.notices).toEqual([]);
      expect(rowsOnTeam).toEqual([{ pool: 'monthly', value: 3000 }]);
      expect(auditOnTeam).toEqual([]);
      expect(enterprise.body.notices).toHaveLength(1);
      expect(await customRows(s.builders[0].id)).toEqual([]);
      expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
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

    it('a plan change adjusts the instance-wide limits; the audit entry is instance-level', async () => {
      const superAdmin = await createUser(app, { email: 'super@tooljet.io', userType: 'instance', groups: ['admin'] });
      const builder = await createUser(app, {
        email: 'builder@tooljet.io',
        groups: ['builder'],
        organization: superAdmin.organization,
      });
      const workspaceId = superAdmin.organization.id;
      const cookie = await sessionFor(superAdmin.user, workspaceId);
      const gateway = stubGateway(
        gatewayFor(
          owner,
          { monthly: 10_000, addon: 0 },
          {},
          { plan: { monthly: 10_000, addon: 0 }, cycleStart: CYCLE_START }
        )
      );
      await request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${builder.user.id}`)
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({ monthly: 3000 })
        .expect(200);
      gateway.mockRestore();
      // 2 builders on 1,000: builder may hold 999, so the 3,000 goes; the default falls from 7,000 to 500.
      stubGateway(
        gatewayFor(owner, { monthly: 1000, addon: 0 }, {}, { plan: { monthly: 1000, addon: 0 }, cycleStart: NEW_CYCLE })
      );

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie);

      expect(res.body.notices).toEqual([
        {
          kind: 'plan_change',
          on: NEW_CYCLE,
          detectedAt: expect.any(String),
          defaults: { monthly: { before: 7000, after: 500 } },
          reduced: 1,
        },
      ]);
      expect(await customRows(builder.user.id)).toEqual([]);
      const [entry] = await auditRows(workspaceId, 'AI_CREDIT_LIMITS_ADJUSTED', 1);
      expect(entry.metadata).toMatchObject({ instance_level: true, reason: 'plan_change' });
    });
  });
});
