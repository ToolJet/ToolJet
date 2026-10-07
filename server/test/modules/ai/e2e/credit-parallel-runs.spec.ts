import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  buildTestSession,
  getDefaultDataSource,
  withRealTransactions,
} from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';
import { AiUtilService } from '@ee/ai/util.service';
import { AiController } from '@ee/ai/controller';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';
const STALE_MS = 3 * 60 * 1000;

/** Stubs fetch at the gateway boundary. `routes` is read per call, so a test can change spend mid-run. */
function stubGateway(routes: () => Record<string, unknown>) {
  const realFetch = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (!url.startsWith(GATEWAY)) return realFetch(input, init);
    const path = url.slice(GATEWAY.length);
    const current = routes();
    if (!(path in current)) return new Response(JSON.stringify({ message: 'not stubbed' }), { status: 404 });
    return new Response(JSON.stringify(current[path]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
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

function gatewayFor(ownerPath: string, pool: { monthly: number; addon: number }, spend: Record<string, number> = {}) {
  const users = Object.entries(spend).map(([userId, monthly]) => ({ userId, ...wallet(monthly) }));
  const used = users.reduce((acc, u) => acc + u.recurring, 0);
  const remaining = wallet(pool.monthly - used, pool.addon);
  const usage = { cycleStart: CYCLE_START, trackingSince: null, users, unattributed: wallet(0), pool: wallet(used) };
  return {
    [`${ownerPath}/balance`]: {
      balance: remaining.total,
      remaining,
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: null },
      cycleStart: CYCLE_START,
    },
    [`${ownerPath}/usage`]: usage,
    [`${ownerPath}/usage?groupBy=organization`]: { ...usage, users: users.map((u) => ({ ...u, byOrganization: [] })) },
  };
}

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

/** The util service the routes actually use (the module graph holds more than one instance). */
const routeUtil = (app: INestApplication) =>
  (app.get(AiController) as unknown as { aiService: { aiUtilService: AiUtilService } }).aiService.aiUtilService;

type Caller = { app: INestApplication; cookie: string[]; organizationId: string };

const post = ({ app, cookie, organizationId }: Caller, path: string, body: object) =>
  request(app.getHttpServer())
    .post(`/api/ai/${path}`)
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie)
    .send(body);

const autosort = (caller: Caller) =>
  post(caller, 'autosort', { queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] });

const sseRefusal = (text: string): string | null => {
  for (const block of text.split('\n\n')) {
    const data = block.split('\n').find((l) => l.startsWith('data: '));
    if (!block.startsWith('event: message') || !data) continue;
    const metadata = JSON.parse(data.slice(6))?.metadata;
    if (metadata?.creditsError) return metadata.category ?? null;
  }
  return null;
};

/** Running actions as the run table sees them: fresh heartbeat unless aged. */
async function seedRuns(userId: string, organizationId: string, n: number, ageMs = 0) {
  const at = new Date(Date.now() - ageMs);
  for (let i = 0; i < n; i++) {
    await getDefaultDataSource().query(
      'INSERT INTO ai_active_runs (user_id, organization_id, started_at, heartbeat_at) VALUES ($1, $2, $3, $3)',
      [userId, organizationId, at]
    );
  }
}

const expectStarted = (res: request.Response, app: INestApplication) => {
  expect(res.statusCode).toBe(201);
  expect(routeUtil(app).callAgentLegacy).toHaveBeenCalled();
};

const expectRunInProgress = (res: request.Response, app: INestApplication) => {
  expect(res.statusCode).toBe(409);
  expect(res.body.code).toBe('run_in_progress');
  expect(res.body.message).toBe("You're close to your limit. Finish your running AI action first.");
  expect(routeUtil(app).callAgentLegacy).not.toHaveBeenCalled();
};

/** @group ai */
describe('Parallel AI actions with headroom', () => {
  const previous = {
    gateway: process.env.TJ_AI_GATEWAY_URL,
    features: process.env.ENABLE_AI_FEATURES,
    maxRuns: process.env.AI_CREDIT_MAX_PARALLEL_RUNS,
    headroom: process.env.AI_CREDIT_PARALLEL_HEADROOM_PERCENT,
  };

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
    delete process.env.AI_CREDIT_MAX_PARALLEL_RUNS;
    delete process.env.AI_CREDIT_PARALLEL_HEADROOM_PERCENT;
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

    // Admin + 3 builders: limit per builder 250 monthly + 25 add-on = 275.
    const POOL = { monthly: 1000, addon: 100 };
    const LIMIT = 275;
    const spentFor = (leftPercent: number) => Math.ceil(LIMIT * (1 - leftPercent / 100));

    async function seed(prefix: string) {
      const admin = await createUser(app, { email: `${prefix}-admin@tooljet.io`, groups: ['end-user', 'admin'] });
      const workspace = admin.organization;
      const builders: User[] = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          (await createUser(app, { email: `${prefix}-b${n}@tooljet.io`, groups: ['builder'], organization: workspace }))
            .user as User
        );
      }
      const builder = builders[0];
      licenseWith(app, { aiPlan: 'credits' });
      return {
        workspace,
        builder,
        userIds: [admin.user.id, ...builders.map((b) => b.id)],
        admin: { app, cookie: await sessionFor(admin.user, workspace.id), organizationId: workspace.id } as Caller,
        asBuilder: { app, cookie: await sessionFor(builder, workspace.id), organizationId: workspace.id } as Caller,
        owner: `/api/ai/organizations/${workspace.id}`,
      };
    }
    type Seed = Awaited<ReturnType<typeof seed>>;

    const setLimits = async (admin: Caller, enabled: boolean) =>
      expect(
        (
          await request(admin.app.getHttpServer())
            .put('/api/ai/credits-usage/limits')
            .set('tj-workspace-id', admin.organizationId)
            .set('Cookie', admin.cookie)
            .send({ enabled })
        ).statusCode
      ).toBe(200);

    const stubAgents = () => {
      const util = routeUtil(app);
      jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [] }]);
      jest.spyOn(util, 'callAgent').mockResolvedValue([new Error('agent stubbed'), null]);
    };

    async function given(prefix: string, opts: { leftPercent: number; running: number; enabled?: boolean }) {
      const s = await seed(`${prefix}${uuidv4().slice(0, 6)}`);
      stubAgents();
      stubGateway(() => gatewayFor(s.owner, POOL, { [s.builder.id]: spentFor(opts.leftPercent) }));
      await setLimits(s.admin, opts.enabled ?? true);
      await seedRuns(s.builder.id, s.workspace.id, opts.running);
      return s;
    }

    it('AC1: 50% left and one running build, a second action starts', async () => {
      const s = await given('ac1', { leftPercent: 50, running: 1 });
      expectStarted(await autosort(s.asBuilder), app);
    });

    it('AC1 (SSE): 50% left and one running build, a second message starts', async () => {
      const s = await given('ac1s', { leftPercent: 50, running: 1 });
      const aiApp = await createApplication(app, { name: `ai-${uuidv4().slice(0, 8)}`, user: s.builder });
      const conversationId = uuidv4();
      await getDefaultDataSource().query(
        'INSERT INTO ai_conversations (id, app_id, user_id, conversation_type) VALUES ($1, $2, $3, $4)',
        [conversationId, aiApp.id, s.builder.id, 'generate']
      );

      const res = await post(s.asBuilder, 'conversation/message', { conversationId, content: 'build me an app' });

      expect(sseRefusal(res.text)).toBeNull();
      expect(res.text).toContain('event: generation');
    });

    it('AC2: three running actions, a fourth is refused with run_in_progress', async () => {
      const s = await given('ac2', { leftPercent: 90, running: 3 });
      expectRunInProgress(await autosort(s.asBuilder), app);
    });

    it('AC2 (SSE): three running actions, a fourth message is refused with run_in_progress and no run', async () => {
      const s = await given('ac2s', { leftPercent: 90, running: 3 });
      const aiApp = await createApplication(app, { name: `ai-${uuidv4().slice(0, 8)}`, user: s.builder });
      const conversationId = uuidv4();
      await getDefaultDataSource().query(
        'INSERT INTO ai_conversations (id, app_id, user_id, conversation_type) VALUES ($1, $2, $3, $4)',
        [conversationId, aiApp.id, s.builder.id, 'generate']
      );

      const res = await post(s.asBuilder, 'conversation/message', { conversationId, content: 'build me an app' });

      expect(sseRefusal(res.text)).toBe('run_in_progress');
      expect(res.text).not.toContain('event: generation');
      const [{ count }] = await getDefaultDataSource().query(
        'SELECT count(*)::int AS count FROM ai_active_runs WHERE user_id = $1',
        [s.builder.id]
      );
      expect(count).toBe(3);
    });

    it('AC3: 15% left and one running action, a second is refused', async () => {
      const s = await given('ac3r', { leftPercent: 15, running: 1 });
      expectRunInProgress(await autosort(s.asBuilder), app);
    });

    it('AC3: 15% left and nothing running, it starts', async () => {
      const s = await given('ac3s', { leftPercent: 15, running: 0 });
      expectStarted(await autosort(s.asBuilder), app);
    });

    it('runs in another workspace do not count on Cloud', async () => {
      const s = await given('cws', { leftPercent: 90, running: 0 });
      const other = await createUser(app, { email: `cws${uuidv4().slice(0, 6)}@tooljet.io`, groups: ['admin'] });
      await seedRuns(s.builder.id, other.organization.id, 3);
      expectStarted(await autosort(s.asBuilder), app);
    });

    it('AC6: a run with a stale heartbeat does not count', async () => {
      const s = await given('ac6', { leftPercent: 90, running: 2 });
      await seedRuns(s.builder.id, s.workspace.id, 1, STALE_MS);
      expectStarted(await autosort(s.asBuilder), app);
    });

    it('AC7: limits off, parallel actions behave as today', async () => {
      const s = await given('ac7', { leftPercent: 5, running: 3, enabled: false });
      expectStarted(await autosort(s.asBuilder), app);
    });

    describe('usage read fails open: cap only', () => {
      const givenNoUsage = async (prefix: string, running: number) => {
        const s = await seed(`${prefix}${uuidv4().slice(0, 6)}`);
        stubAgents();
        const routes = gatewayFor(s.owner, POOL, { [s.builder.id]: spentFor(5) });
        stubGateway(() => routes);
        await setLimits(s.admin, true);
        delete routes[`${s.owner}/usage`];
        await seedRuns(s.builder.id, s.workspace.id, running);
        return s;
      };

      it('two running, a third starts (headroom unknown)', async () => {
        const s = await givenNoUsage('foa', 2);
        expectStarted(await autosort(s.asBuilder), app);
      });

      it('three running, a fourth is refused', async () => {
        const s = await givenNoUsage('fob', 3);
        expectRunInProgress(await autosort(s.asBuilder), app);
      });
    });

    it('AC8: the limit runs out mid-build: it finishes, the overshoot counts, the next is credit_limit_reached', async () => {
      const s = await seed(`ac8${uuidv4().slice(0, 6)}`);
      let spent = spentFor(10);
      stubGateway(() => gatewayFor(s.owner, POOL, { [s.builder.id]: spent }));
      await setLimits(s.admin, true);
      const util = routeUtil(app);
      jest.spyOn(util, 'callAgentLegacy').mockImplementation(async () => {
        spent = LIMIT + 40;
        return [null, { assignments: [], newFolders: [] }];
      });

      const first = await autosort(s.asBuilder);
      const next = await autosort(s.asBuilder);
      const usage = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.admin.cookie);

      expect(first.statusCode).toBe(201);
      expect(next.statusCode).toBe(402);
      expect(next.body.code).toBe('credit_limit_reached');
      expect(usage.body.rows.find((r: { userId: string }) => r.userId === s.builder.id).monthly).toBe(LIMIT + 40);
    });

    // Real transactions: inside the suite transaction every request shares one session and the lock never blocks.
    it('AC4: simultaneous requests past the cap start no more than the cap', async () => {
      await withRealTransactions(async () => {
        let s: Seed | undefined;
        try {
          s = await seed(`ac4${uuidv4().slice(0, 6)}`);
          stubGateway(() => gatewayFor(s.owner, POOL));
          await setLimits(s.admin, true);
          const util = routeUtil(app);
          let release: () => void;
          const held = new Promise<void>((r) => (release = r));
          const begin = jest.spyOn(util, 'beginActiveRun');
          jest.spyOn(util, 'callAgentLegacy').mockImplementation(async () => {
            await held;
            return [null, { assignments: [], newFolders: [] }];
          });

          const pending = Array.from({ length: 6 }, () => autosort(s.asBuilder).then((r) => r));
          const deadline = Date.now() + 20_000;
          while (begin.mock.results.filter((r) => r.type === 'return').length < 6 && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 50));
          }
          await Promise.allSettled(begin.mock.results.map((r) => r.value));
          const [{ count }] = await getDefaultDataSource().query(
            'SELECT count(*)::int AS count FROM ai_active_runs WHERE user_id = $1',
            [s.builder.id]
          );
          release();
          const results = await Promise.all(pending);

          expect(count).toBe(3);
          expect(results.filter((r) => r.statusCode === 201)).toHaveLength(3);
          expect(results.filter((r) => r.statusCode === 409)).toHaveLength(3);
        } finally {
          if (s) {
            const db = getDefaultDataSource();
            for (const table of ['ai_active_runs', 'ai_credit_limits', 'audit_logs', 'data_sources']) {
              await db.query(`DELETE FROM ${table} WHERE organization_id = $1`, [s.workspace.id]);
            }
            await db.query('DELETE FROM organizations WHERE id = $1', [s.workspace.id]);
            await db.query('DELETE FROM users WHERE id = ANY($1)', [s.userIds]);
          }
        }
      });
    }, 60_000);
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s8';
    const owner = `/api/ai/selfhost-customers/${customerId}`;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('AC5: running actions in workspace A count toward the cap in workspace B', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh8-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const workspaceB = superAdmin.organization;
      const builder = (
        await createUser(app, { email: 'sh8-builder@tooljet.io', groups: ['builder'], organization: workspaceB })
      ).user as User;
      const workspaceA = (await createUser(app, { email: 'sh8-other@tooljet.io', groups: ['admin'] })).organization;
      licenseWith(app, { aiPlan: 'credits', aiEnabled: true, ai: { apiKey: 'selfhost-key' }, metadata: { customerId } });
      stubGateway(() => gatewayFor(owner, { monthly: 1000, addon: 0 }));
      expect(
        (
          await request(app.getHttpServer())
            .put('/api/ai/credits-usage/limits')
            .set('tj-workspace-id', workspaceB.id)
            .set('Cookie', await sessionFor(superAdmin.user, workspaceB.id))
            .send({ enabled: true })
        ).statusCode
      ).toBe(200);
      jest.spyOn(routeUtil(app), 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [] }]);
      await seedRuns(builder.id, workspaceA.id, 3);

      const res = await autosort({ app, cookie: await sessionFor(builder, workspaceB.id), organizationId: workspaceB.id });

      expectRunInProgress(res, app);
    });
  });
});
