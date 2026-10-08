import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  getDefaultDataSource,
  withRealTransactions,
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
} from 'test-helper';
import { User } from '@entities/user.entity';
import { AiController } from '@ee/ai/controller';
import { AiUtilService } from '@ee/ai/util.service';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';

// Notices show only when found in the current cycle, so cycles start in the past.
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const CYCLE_START = ago(10 * 24 * 3600_000);
const NEW_CYCLE = ago(3600_000);
const ADDON_END = ago(60_000);

const customRows = (userId: string) =>
  getDefaultDataSource().query('SELECT pool, value FROM ai_credit_limits WHERE user_id = $1 ORDER BY pool', [userId]);

/** @group ai */
describe('AI credit limit adjustment on a pool change', () => {
  const previous = { gateway: process.env.TJ_AI_GATEWAY_URL, features: process.env.ENABLE_AI_FEATURES };

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
  });

  afterAll(() => {
    for (const [key, value] of [
      ['TJ_AI_GATEWAY_URL', previous.gateway],
      ['ENABLE_AI_FEATURES', previous.features],
    ]) {
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

    /**
     * Seeds an admin and 3 builders: 4 builders on a 10,000 monthly plan.
     * Builder 1 holds a custom 3,000, so the 3 others share the remaining 7,000: 2,333 each (rounded down).
     * The save records the plan sizes, so a later read can spot a shrink.
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

    /**
     * The plan dropped to 2,003 at a new cycle. The 3 other builders must keep at least 1 credit each,
     * so builder 1 may now hold up to 2,003 − 3 = 2,000, and their custom 3,000 no longer fits.
     */
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

    describe('when a plan change drops the max to 2,000', () => {
      it('should reset a 3,000 custom limit to the default, audited as the system, with a notice on every read', async () => {
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
    });

    describe('when a renewal only carries in overdraft', () => {
      it('should change no limit and show no notice', async () => {
        const s = await seed('sales');
        // Same 10,000 plan, but 9,000 of overdraft carried in, so the new cycle starts with 1,000 remaining.
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
    });

    describe('when an add-on expires', () => {
      it('should lower add-on limits only, dated by the expiry', async () => {
        // Builder 1 holds a custom 3,000 monthly and 1,500 of the 2,000 add-on pool.
        // The 3 others share the remaining 500 add-on: 166 each (rounded down).
        // The add-on then expires, so the add-on default falls from 166 to 0.
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
    });

    describe('when an admin saves after a shrink', () => {
      it('should adjust the limits first, audited as the system', async () => {
        const s = await seed('sales');
        stubGateway(smallerPlan(s.owner));

        // Builder 1's custom 3,000 no longer fits the 2,003 pool.
        // The save resets it first; otherwise the custom 500 default would be refused as over the max.
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
    });

    describe('when the first AI action runs after a plan change', () => {
      // No dashboard read in between: the spend check itself finds the shrink.
      it('should refuse it with 402 against the adjusted limit', async () => {
        const s = await seed('sales');
        const builder = s.builders[0];
        stubAgents();
        // Builder 1 spent 600: under their old custom 3,000,
        //   but over the new default of 500 (2,003 ÷ 4, rounded down) once that custom limit is reset.
        stubGateway(smallerPlan(s.owner, { [builder.id]: 600 }));

        const res = await copilot(await sessionFor(builder, s.workspace.id), s.workspace.id);

        expect(res.statusCode).toBe(402);
        expect(res.body.code).toBe('credit_limit_reached');
        expect(await customRows(builder.id)).toEqual([]);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMITS_ADJUSTED', 1)).toHaveLength(1);
      });
    });

    describe('when a builder reads their own credits after a plan change', () => {
      it('should show the adjusted limit', async () => {
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
    });

    describe('when a read holds an older balance', () => {
      it('should not write it back over a newer one', async () => {
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
    });

    describe('when two reads detect the same shrink', () => {
      // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
      it('should adjust once and log once', async () => {
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
    });

    describe('on the team plan', () => {
      describe('when the pool shrinks', () => {
        it('should leave limits alone, then apply the shrink once after an upgrade', async () => {
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

    describe('when a plan change shrinks the pool', () => {
      it('should adjust the instance-wide limits with an instance-level audit entry', async () => {
        const superAdmin = await createUser(app, {
          email: 'super@tooljet.io',
          userType: 'instance',
          groups: ['admin'],
        });
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
        // The plan dropped from 10,000 to 1,000, shared by 2 builders (the super admin and the builder).
        // The builder may now hold at most 1,000 − 1 = 999, so their custom 3,000 is reset.
        // The default falls from 7,000 (10,000 − 3,000) to 500 (1,000 ÷ 2).
        stubGateway(
          gatewayFor(
            owner,
            { monthly: 1000, addon: 0 },
            {},
            { plan: { monthly: 1000, addon: 0 }, cycleStart: NEW_CYCLE }
          )
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
});
