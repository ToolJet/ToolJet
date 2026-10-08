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
} from 'test-helper';
import { User } from '@entities/user.entity';
import { AiActiveRun } from '@entities/ai_active_run.entity';
import { AiUtilService } from '@ee/ai/util.service';
import { AiController } from '@ee/ai/controller';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';
import * as creditLimits from '@ee/ai/services/credit-limits';
import {
  GATEWAY,
  SELF_HOSTED_CUSTOMER,
  SELF_HOSTED_TERMS,
  TEAM_TERMS,
  dropSeed,
  gatewayFor,
  sessionFor,
  stubGateway,
  useLicence,
} from './credits-gateway';

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
describe('AI credit enforcement: whether an AI action may start', () => {
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
    process.env.TJ_AI_GATEWAY_URL = previous.gateway;
    process.env.ENABLE_AI_FEATURES = previous.features;
    for (const [key, value] of [
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
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Admin + 3 builders = 4 builders, plus an end user. On 1,000 + 100 each builder's limit is 250 + 25 = 275. */
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

    describe('the spend check', () => {
      it('a builder at their limit is refused on the SSE routes, and no agent runs', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        // A new workspace has limits on: 275 spent is the whole 250 + 25.
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

      it('a builder at their limit is refused on the HTTP routes with 402, and no agent runs', async () => {
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

      it('a builder who has used 85% of their limit, with nothing running, can send a message', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 233 }));

        const res = await message(s);

        expect(sseRefusal(res.text)).toBeNull();
        expect(res.text).toContain('event: generation');
      });

      it('an empty pool refuses every builder with the same copy whether limits are on or off', async () => {
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

      it('balance read fails: SSE routes send a balance_unavailable message, HTTP routes return 503', async () => {
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

      it('balance read hangs: the action is refused with 503 within the read budget', async () => {
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

      it('usage read hangs: the action starts and the fail-open count goes up', async () => {
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

      // The database failure is injected at our own read: there is no other way to fail it.
      it('limits read fails: the action starts and the fail-open count goes up', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 275 }));
        jest.spyOn(creditLimits, 'loadScopeLimits').mockRejectedValue(new Error('db down'));

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
        expect(failOpenCount).toHaveBeenCalledWith(1);
      });

      it('fix-with-ai has no floor of its own: 2 credits left is not a credits refusal', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 2, addon: 0 }));
        await setLimits(s, false);

        const res = await post(s, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' });

        // Past the spend check, the run itself fails on the unknown component.
        expect(res.statusCode).toBe(500);
      });

      it('an end user cannot call fix-with-ai or copilot (403)', async () => {
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

      it('on a Team licence a builder over the limit is not refused', async () => {
        const s = await seed('team');
        restoreLicence = useLicence(app, TEAM_TERMS);
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 600 }));

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
      });

      it('a build that crosses the limit finishes; the next action is refused', async () => {
        const s = await seed('sales');
        // 28 spent leaves 90%; the build itself spends past the limit.
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

    describe('parallel actions', () => {
      afterEach(() => {
        delete process.env.AI_CREDIT_MAX_PARALLEL_RUNS;
      });

      it('with half their limit left and one action running, a builder can start another', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 138 }));
        await seedRuns(s.builder.id, s.workspace.id, 1);

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
      });

      it('a builder with three actions running is refused a fourth (409)', async () => {
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

      it('with 15% left and one action running, a second is refused with the headroom copy over HTTP and SSE', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        // 234 of 275 spent: 41 left, 14.9%.
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

      it('actions running in another workspace do not count', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        const other = await createUser(app, { email: 'other-admin@tooljet.io', groups: ['admin'] });
        await seedRuns(s.builder.id, other.organization.id, 3);

        expect((await autosort(s)).statusCode).toBe(201);
      });

      it('a run whose heartbeat stopped does not count toward the cap', async () => {
        const s = await seed('sales');
        stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 28 }));
        await seedRuns(s.builder.id, s.workspace.id, 2);
        await seedRuns(s.builder.id, s.workspace.id, 1, 3 * 60 * 1000);

        expect((await autosort(s)).statusCode).toBe(201);
      });

      it('usage read fails with two actions running: a third starts, the cap still applies', async () => {
        const s = await seed('sales');
        stubAgents(app);
        const routes = gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 262 });
        delete routes[`${s.owner}/usage`];
        stubGateway(routes);
        await seedRuns(s.builder.id, s.workspace.id, 2);

        const third = await autosort(s);
        await seedRuns(s.builder.id, s.workspace.id, 1);
        const fourth = await autosort(s);

        // 262 spent is 5% left: the headroom would refuse, but it is unknown.
        expect(third.statusCode).toBe(201);
        expect(fourth.statusCode).toBe(409);
        expect(fourth.body.code).toBe('run_in_progress');
      });

      it('limits off: a builder over the default with three actions running still starts one', async () => {
        const s = await seed('sales');
        const util = stubAgents(app);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, { [s.builder.id]: 600 }));
        await setLimits(s, false);
        await seedRuns(s.builder.id, s.workspace.id, 3);

        const res = await autosort(s);

        expect(res.statusCode).toBe(201);
        expect(util.callAgentLegacy).toHaveBeenCalled();
      });

      it('the max parallel runs setting is read on each run start', async () => {
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

      // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
      it('simultaneous requests start no more than three runs', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`race-${uuidv4().slice(0, 6)}`);
          try {
            stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
            const util = routeServices(app).aiService.aiUtilService;
            let release: () => void;
            const held = new Promise<void>((resolve) => (release = resolve));
            const begin = jest.spyOn(util, 'beginActiveRun');
            // Widen the count → insert window so starts that are not serialized all read 0.
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

    /** Super admin + 1 builder = 2 builders on the instance; on 1,000 each builder's limit is 500. */
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

    it('a builder at their instance-wide limit is refused (402)', async () => {
      const s = await seed();
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }, { [s.builder.id]: 500 }));

      const res = await autosort(s);

      expect(res.statusCode).toBe(402);
      expect(res.body.code).toBe('credit_limit_reached');
    });

    it('actions running in another workspace count toward the cap', async () => {
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

  describe('CE', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      process.env.TOOLJET_EDITION = 'ce';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('fix-with-ai and copilot are not served (404)', async () => {
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
