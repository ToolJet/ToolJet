import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { metrics, Meter } from '@opentelemetry/api';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  getDefaultDataSource,
  withRealTransactions,
  GATEWAY,
  SELF_HOSTED_CUSTOMER,
  SELF_HOSTED_TERMS,
  TEAM_TERMS,
  dropSeed,
  gatewayFor,
  sessionFor,
  stubGateway,
  useLicence,
} from 'test-helper';
import { User } from '@entities/user.entity';
import { AiActiveRun } from '@entities/ai_active_run.entity';
import { AiUtilService } from '@ee/ai/util.service';
import { AiController } from '@ee/ai/controller';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';
import * as creditLimits from '@ee/ai/services/credit-limits';

/** The services the routes use (the module graph holds more than one instance of each). */
const routeServices = (app: INestApplication) =>
  app.get(AiController) as unknown as {
    aiService: { aiUtilService: AiUtilService };
    builderUsageService: BuilderUsageService;
  };

/** Agent calls end at the agent boundary, so actions that start finish at once. */
function stubAgents(app: INestApplication) {
  const util = routeServices(app).aiService.aiUtilService;
  jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [], code: '' }]);
  jest.spyOn(util, 'callAgent').mockResolvedValue([new Error('agent stubbed'), null]);
  return util;
}

/** Running actions as the run table sees them; `ageMs` makes the heartbeat stale. */
async function seedRuns(userId: string, organizationId: string, count: number, ageMs = 0) {
  const at = new Date(Date.now() - ageMs);
  for (let i = 0; i < count; i++) {
    await getDefaultDataSource().query(
      'INSERT INTO ai_active_runs (user_id, organization_id, started_at, heartbeat_at) VALUES ($1, $2, $3, $3)',
      [userId, organizationId, at]
    );
  }
}

const runCount = async (userId: string) =>
  (
    await getDefaultDataSource().query('SELECT count(*)::int AS count FROM ai_active_runs WHERE user_id = $1', [userId])
  )[0].count;

/** The credits-error message an SSE route sends when it refuses an action; null when it sent none. */
function sseRefusal(text: string): { category: string; content: string } | null {
  for (const block of text.split('\n\n')) {
    const data = block.split('\n').find((line) => line.startsWith('data: '));
    if (!block.startsWith('event: message') || !data) continue;
    const message = JSON.parse(data.slice(6));
    if (message?.metadata?.creditsError) return { category: message.metadata.category, content: message.content };
  }
  return null;
}

/** @group ai */
describe('AI credit enforcement', () => {
  const previous = {
    gateway: process.env.TJ_AI_GATEWAY_URL,
    features: process.env.ENABLE_AI_FEATURES,
    maxRuns: process.env.AI_CREDIT_MAX_PARALLEL_RUNS,
    headroom: process.env.AI_CREDIT_PARALLEL_HEADROOM_PERCENT,
  };
  // The fail-open counter is created on first use and cached, so every test hands out the same fake.
  const failOpenCount = jest.fn();

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
    delete process.env.AI_CREDIT_MAX_PARALLEL_RUNS;
    delete process.env.AI_CREDIT_PARALLEL_HEADROOM_PERCENT;
  });

  beforeEach(() => {
    failOpenCount.mockClear();
    jest
      .spyOn(metrics, 'getMeter')
      .mockReturnValue({ createCounter: () => ({ add: failOpenCount }) } as unknown as Meter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    for (const [key, value] of [
      ['TJ_AI_GATEWAY_URL', previous.gateway],
      ['ENABLE_AI_FEATURES', previous.features],
      ['AI_CREDIT_MAX_PARALLEL_RUNS', previous.maxRuns],
      ['AI_CREDIT_PARALLEL_HEADROOM_PERCENT', previous.headroom],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
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
      delete process.env.AI_CREDIT_MAX_PARALLEL_RUNS;
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /**
     * Seeds an admin, 3 builders and an end user. The admin counts as a builder, so 4 builders share the pool.
     * On a 1,000 monthly + 100 add-on pool, each builder's limit is 250 monthly + 25 add-on: 275 in total.
     */
    async function seed(name: string) {
      const admin = await createUser(app, { email: `${name}-admin@tooljet.io`, groups: ['admin'] });
      const workspace = admin.organization;
      const builders: User[] = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          (await createUser(app, { email: `${name}-b${n}@tooljet.io`, groups: ['builder'], organization: workspace }))
            .user as User
        );
      }
      const endUser = (
        await createUser(app, { email: `${name}-end@tooljet.io`, groups: ['end-user'], organization: workspace })
      ).user as User;
      const builder = builders[0];
      return {
        workspace,
        builder,
        endUser,
        owner: `/api/ai/organizations/${workspace.id}`,
        adminCookie: await sessionFor(admin.user, workspace.id),
        builderCookie: await sessionFor(builder, workspace.id),
        userIds: [admin.user.id, ...builders.map((b) => b.id), endUser.id],
      };
    }
    type Seed = Awaited<ReturnType<typeof seed>>;

    async function conversationFor(builder: User, type: 'generate' | 'learn') {
      const aiApp = await createApplication(app, { name: `ai-${uuidv4().slice(0, 8)}`, user: builder });
      const id = uuidv4();
      await getDefaultDataSource().query(
        'INSERT INTO ai_conversations (id, app_id, user_id, conversation_type) VALUES ($1, $2, $3, $4)',
        [id, aiApp.id, builder.id, type]
      );
      return id;
    }

    const post = (s: Seed, path: string, body: object, cookie = s.builderCookie) =>
      request(app.getHttpServer())
        .post(`/api/ai/${path}`)
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', cookie)
        .send(body);

    const autosort = (s: Seed) =>
      post(s, 'autosort', { queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] });

    const message = async (s: Seed) =>
      post(s, 'conversation/message', {
        conversationId: await conversationFor(s.builder, 'generate'),
        content: 'build me an app',
      });

    const setLimits = (s: Seed, enabled: boolean) =>
      request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.adminCookie)
        .send({ enabled })
        .expect(200);

    describe('when the builder is at their limit', () => {
      it('should refuse the SSE message and docs-message routes with a credit_limit_reached message and start no agent', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        // A new workspace has limits on. 275 spent is the builder's whole limit (250 monthly + 25 add-on).
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 275 }));

        const sent = await message(s);
        const docs = await post(s, 'conversation/docs-message', {
          conversationId: await conversationFor(s.builder, 'learn'),
          content: 'how do I add a table?',
        });

        expect(sseRefusal(sent.text)).toEqual({
          category: 'credit_limit_reached',
          content: expect.stringContaining('limit'),
        });
        expect(sent.text).not.toContain('event: generation');
        expect(sseRefusal(docs.text)?.category).toBe('credit_limit_reached');
        expect(util.callAgent).not.toHaveBeenCalled();
      });

      it('should refuse fix-with-ai, autosort and copilot with 402 credit_limit_reached and start no agent', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 275 }));

        const fix = await post(s, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' });
        const sorted = await autosort(s);
        const copilot = await post(s, 'copilot', { prompt: 'sum', context: '', language: 'javascript' });

        for (const res of [fix, sorted, copilot]) {
          expect(res.statusCode).toBe(402);
          expect(res.body.code).toBe('credit_limit_reached');
        }
        expect(util.callAgent).not.toHaveBeenCalled();
        expect(util.callAgentLegacy).not.toHaveBeenCalled();
      });
    });

    describe('when the builder has used 85% of their limit with nothing running', () => {
      it('should let them send a message', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 233 }));

        const res = await message(s);

        expect(sseRefusal(res.text)).toBeNull();
        expect(res.text).toContain('event: generation');
      });
    });

    describe('when the pool is empty', () => {
      it('should refuse every builder with pool_empty "Your workspace is out of AI credits. Ask your admin to add more." whether limits are on or off', async () => {
        const s = await seed('sales');
        stubAgents(app);
        // Another builder drained the pool; this builder has spent nothing.
        const drainer = (await createUser(app, { groups: ['builder'], organization: s.workspace })).user;
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 0 }, { [drainer.id]: 1000 }));

        await setLimits(s, false);
        const offMessage = await message(s);
        const offAutosort = await autosort(s);
        await setLimits(s, true);
        const onMessage = await message(s);
        const onAutosort = await autosort(s);

        const copy = 'Your workspace is out of AI credits. Ask your admin to add more.';
        expect(sseRefusal(offMessage.text)).toEqual({ category: 'pool_empty', content: copy });
        expect(sseRefusal(onMessage.text)).toEqual({ category: 'pool_empty', content: copy });
        expect(offAutosort.statusCode).toBe(402);
        expect(offAutosort.body).toMatchObject({ code: 'pool_empty', message: copy });
        expect(onAutosort.statusCode).toBe(402);
        expect(onAutosort.body).toMatchObject({ code: 'pool_empty', message: copy });
      });
    });

    describe('when the balance read fails', () => {
      it('should send a balance_unavailable message on SSE routes and return 503 balance_unavailable on HTTP routes', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway({});

        const sent = await message(s);
        const sorted = await autosort(s);

        expect(sseRefusal(sent.text)?.category).toBe('balance_unavailable');
        expect(sent.text).not.toContain('event: error');
        expect(sorted.statusCode).toBe(503);
        expect(sorted.body.code).toBe('balance_unavailable');
        expect(util.callAgentLegacy).not.toHaveBeenCalled();
      });
    });

    describe('when the balance read hangs', () => {
      it('should refuse the action with 503 balance_unavailable within the read budget', async () => {
        const s = await seed('sales');
        stubAgents(app);
        const routes = gatewayFor(s.owner, { monthly: 1000, addon: 100 });
        routes[`${s.owner}/balance`] = () => new Promise(() => undefined);
        stubGateway(routes);
        jest.replaceProperty(routeServices(app).builderUsageService, 'spendCheckTimeoutMs', 50);

        const res = await autosort(s).timeout(3000);

        expect(res.statusCode).toBe(503);
        expect(res.body.code).toBe('balance_unavailable');
      });
    });

    describe('when the usage read hangs', () => {
      it('should start the action and count one fail-open', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        // At the limit: if the usage read answered, this would be refused.
        const routes = gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 275 });
        routes[`${s.owner}/usage`] = () => new Promise(() => undefined);
        stubGateway(routes);
        jest.replaceProperty(routeServices(app).builderUsageService, 'spendCheckTimeoutMs', 50);

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
        expect(failOpenCount).toHaveBeenCalledWith(1);
      });
    });

    describe('when the limits read fails', () => {
      // The database failure is injected at our own read: there is no other way to fail it.
      it('should start the action and count one fail-open', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 275 }));
        jest.spyOn(creditLimits, 'loadScopeLimits').mockRejectedValue(new Error('db down'));

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
        expect(failOpenCount).toHaveBeenCalledWith(1);
      });
    });

    describe('with 2 credits left in the pool and limits off', () => {
      it('should not refuse fix-with-ai for credits', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 2, addon: 0 }));
        await setLimits(s, false);

        const res = await post(s, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' });

        // Past the spend check, the run itself fails on the unknown component.
        expect(res.statusCode).toBe(500);
      });
    });

    describe('when an end user calls fix-with-ai or copilot', () => {
      it('should return 403 and start no agent', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const cookie = await sessionFor(s.endUser, s.workspace.id);

        const fix = await post(s, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' }, cookie);
        const copilot = await post(s, 'copilot', { prompt: 'sum', context: '', language: 'javascript' }, cookie);

        expect(fix.statusCode).toBe(403);
        expect(copilot.statusCode).toBe(403);
        expect(util.callAgent).not.toHaveBeenCalled();
        expect(util.callAgentLegacy).not.toHaveBeenCalled();
      });
    });

    describe('when a build crosses the limit', () => {
      it('should finish the build and refuse the next action with 402 credit_limit_reached', async () => {
        const s = await seed('sales');
        // The builder starts with 28 of their 275 spent, about 90% left.
        // The stubbed build raises their spend to 315, past the limit.
        const routes = gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 });
        stubGateway(routes);
        jest.spyOn(routeServices(app).aiService.aiUtilService, 'callAgentLegacy').mockImplementation(async () => {
          Object.assign(routes, gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 315 }));
          return [null, { assignments: [], newFolders: [] }];
        });

        const first = await autosort(s);
        const next = await autosort(s);

        expect(first.statusCode).toBe(201);
        expect(next.statusCode).toBe(402);
        expect(next.body.code).toBe('credit_limit_reached');
      });
    });

    describe('with half their limit left and one action already running', () => {
      it('should let the builder start another', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 138 }));
        await seedRuns(s.builder.id, s.workspace.id, 1);

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
      });
    });

    describe('with three actions already running', () => {
      it('should refuse a fourth with 409 run_in_progress "Finish one of your running AI actions first."', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        await seedRuns(s.builder.id, s.workspace.id, 3);

        const res = await autosort(s);

        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({
          code: 'run_in_progress',
          message: 'Finish one of your running AI actions first.',
        });
        expect(util.callAgentLegacy).not.toHaveBeenCalled();
        expect(await runCount(s.builder.id)).toBe(3);
      });
    });

    describe('with 15% of their limit left and one action already running', () => {
      it(`should refuse a second with 409 run_in_progress "You're close to your limit. Finish your running AI action first." over HTTP and SSE`, async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        // The builder spent 234 of their 275 limit: 41 left, which is 14.9%.
        // A second action needs at least 20% left.
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 234 }));
        await seedRuns(s.builder.id, s.workspace.id, 1);

        const sorted = await autosort(s);
        const sent = await message(s);

        const copy = "You're close to your limit. Finish your running AI action first.";
        expect(sorted.statusCode).toBe(409);
        expect(sorted.body).toMatchObject({ code: 'run_in_progress', message: copy });
        expect(sseRefusal(sent.text)).toEqual({ category: 'run_in_progress', content: copy });
        expect(util.callAgentLegacy).not.toHaveBeenCalled();
        expect(await runCount(s.builder.id)).toBe(1);
      });
    });

    describe('with three actions running in another workspace', () => {
      it('should not count them toward the cap', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        const other = await createUser(app, { email: 'other-admin@tooljet.io', groups: ['admin'] });
        await seedRuns(s.builder.id, other.organization.id, 3);

        expect((await autosort(s)).statusCode).toBe(201);
      });
    });

    describe('with a run whose heartbeat stopped', () => {
      it('should not count it toward the cap', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        await seedRuns(s.builder.id, s.workspace.id, 2);
        await seedRuns(s.builder.id, s.workspace.id, 1, 3 * 60 * 1000);

        expect((await autosort(s)).statusCode).toBe(201);
      });
    });

    describe('when the usage read fails with two actions running', () => {
      it('should start a third and refuse a fourth with 409 run_in_progress', async () => {
        const s = await seed('sales');
        stubAgents(app);
        const routes = gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 262 });
        delete routes[`${s.owner}/usage`];
        stubGateway(routes);
        await seedRuns(s.builder.id, s.workspace.id, 2);

        const third = await autosort(s);
        await seedRuns(s.builder.id, s.workspace.id, 1);
        const fourth = await autosort(s);

        // 262 of 275 spent leaves 13, under 5%: the 20% headroom rule would refuse a second action.
        // But the usage read fails, so spend is unknown and only the 3-run cap applies.
        expect(third.statusCode).toBe(201);
        expect(fourth.statusCode).toBe(409);
        expect(fourth.body.code).toBe('run_in_progress');
      });
    });

    describe('with limits off and a builder over the default with three actions running', () => {
      it('should start one more action', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 600 }));
        await setLimits(s, false);
        await seedRuns(s.builder.id, s.workspace.id, 3);

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
      });
    });

    describe('when the max parallel runs setting changes', () => {
      it('should apply the new value on the next run start', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        await seedRuns(s.builder.id, s.workspace.id, 1);

        const before = await autosort(s);
        process.env.AI_CREDIT_MAX_PARALLEL_RUNS = '1';
        const after = await autosort(s);

        expect(before.statusCode).toBe(201);
        expect(after.statusCode).toBe(409);
        expect(after.body.message).toBe('Finish one of your running AI actions first.');
      });
    });

    describe('with six simultaneous requests', () => {
      // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
      it('should start no more than three runs', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`race-${uuidv4().slice(0, 6)}`);
          try {
            stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
            const util = routeServices(app).aiService.aiUtilService;
            let release: () => void;
            const held = new Promise<void>((resolve) => (release = resolve));
            const begin = jest.spyOn(util, 'beginActiveRun');
            // Delay between counting runs and inserting one, so starts that are not serialized would all count 0.
            const realCount = EntityManager.prototype.count;
            jest.spyOn(EntityManager.prototype, 'count').mockImplementation(async function (
              this: EntityManager,
              ...args: Parameters<EntityManager['count']>
            ) {
              const n = await realCount.apply(this, args);
              if (args[0] === AiActiveRun) await new Promise((r) => setTimeout(r, 300));
              return n;
            });
            jest.spyOn(util, 'callAgentLegacy').mockImplementation(async () => {
              await held;
              return [null, { assignments: [], newFolders: [] }];
            });

            const pending = Array.from({ length: 6 }, () => autosort(s).then((r) => r));
            const deadline = Date.now() + 20_000;
            while (begin.mock.results.filter((r) => r.type === 'return').length < 6 && Date.now() < deadline) {
              await new Promise((r) => setTimeout(r, 50));
            }
            await Promise.allSettled(begin.mock.results.map((r) => r.value));
            const running = await runCount(s.builder.id);
            release();
            const results = await Promise.all(pending);

            expect(running).toBe(3);
            expect(results.filter((r) => r.statusCode === 201)).toHaveLength(3);
            expect(results.filter((r) => r.statusCode === 409)).toHaveLength(3);
          } finally {
            await dropSeed(s.workspace.id, s.userIds);
          }
        });
      }, 60_000);
    });

    describe('on the team plan', () => {
      describe('when a builder over the limit starts an action', () => {
        it('should not refuse it', async () => {
          const s = await seed('team');
          restoreLicence = useLicence(app, TEAM_TERMS);
          const util = stubAgents(app);
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 600 }));

          const res = await autosort(s);

          expect(res.statusCode).toBe(201);
          expect(util.callAgentLegacy).toHaveBeenCalled();
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

    /** Seeds a super admin and 1 builder: 2 builders on the instance, so on a 1,000 pool each builder's limit is 500. */
    async function seed() {
      const superAdmin = await createUser(app, { email: 'super@tooljet.io', userType: 'instance', groups: ['admin'] });
      const workspace = superAdmin.organization;
      const builder = (
        await createUser(app, { email: 'builder@tooljet.io', groups: ['builder'], organization: workspace })
      ).user as User;
      jest
        .spyOn(routeServices(app).aiService.aiUtilService, 'callAgentLegacy')
        .mockResolvedValue([null, { assignments: [], newFolders: [] }]);
      return { workspace, builder, builderCookie: await sessionFor(builder, workspace.id) };
    }

    const autosort = (s: Awaited<ReturnType<typeof seed>>) =>
      request(app.getHttpServer())
        .post('/api/ai/autosort')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.builderCookie)
        .send({ queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] });

    describe('when the builder is at their instance-wide limit', () => {
      it('should refuse the action with 402 credit_limit_reached', async () => {
        const s = await seed();
        stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }, { [s.builder.id]: 500 }));

        const res = await autosort(s);

        expect(res.statusCode).toBe(402);
        expect(res.body.code).toBe('credit_limit_reached');
      });
    });

    describe('with three actions running in another workspace', () => {
      it('should count them toward the cap and refuse with 409 run_in_progress', async () => {
        const s = await seed();
        stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));
        const other = await createUser(app, { email: 'other-admin@tooljet.io', groups: ['admin'] });
        await seedRuns(s.builder.id, other.organization.id, 3);

        const res = await autosort(s);

        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({
          code: 'run_in_progress',
          message: 'Finish one of your running AI actions first.',
        });
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

    describe('when a builder calls fix-with-ai or copilot', () => {
      it('should return 404', async () => {
        const builder = await createUser(app, { email: 'builder@tooljet.io', groups: ['builder'] });
        const cookie = await sessionFor(builder.user, builder.organization.id);

        const fix = await request(app.getHttpServer())
          .post('/api/ai/fix-with-ai')
          .set('tj-workspace-id', builder.organization.id)
          .set('Cookie', cookie)
          .send({});
        const copilot = await request(app.getHttpServer())
          .post('/api/ai/copilot')
          .set('tj-workspace-id', builder.organization.id)
          .set('Cookie', cookie)
          .send({});

        expect(fix.statusCode).toBe(404);
        expect(copilot.statusCode).toBe(404);
      });
    });
  });
});
