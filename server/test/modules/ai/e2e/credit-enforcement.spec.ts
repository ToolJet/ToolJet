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
} from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';
import { AiUtilService } from '@ee/ai/util.service';
import { AiController } from '@ee/ai/controller';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';

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

/** Monthly-only spend per user; remaining = pool − Σ spend, so it goes negative when the pool is overdrawn. */
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
    [`${ownerPath}/usage?groupBy=organization`]: {
      ...usage,
      users: users.map((u) => ({ ...u, byOrganization: [] })),
    },
  };
}

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

async function conversationFor(app: INestApplication, user: User, type: 'generate' | 'learn') {
  const aiApp = await createApplication(app, { name: `ai-${uuidv4().slice(0, 8)}`, user });
  const id = uuidv4();
  await getDefaultDataSource().query(
    'INSERT INTO ai_conversations (id, app_id, user_id, conversation_type) VALUES ($1, $2, $3, $4)',
    [id, aiApp.id, user.id, type]
  );
  return id;
}

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

/** The persisted credits-error message an SSE route sends when it refuses; null when none. */
const sseRefusalMessage = (text: string): { content?: string; metadata: { category?: string } } | null => {
  for (const block of text.split('\n\n')) {
    const data = block.split('\n').find((l) => l.startsWith('data: '));
    if (!block.startsWith('event: message') || !data) continue;
    const message = JSON.parse(data.slice(6));
    if (message?.metadata?.creditsError) return message;
  }
  return null;
};

/** @group ai */
describe('AI credit enforcement', () => {
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

    async function seed(prefix: string) {
      const admin = await createUser(app, { email: `${prefix}-admin@tooljet.io`, groups: ['end-user', 'admin'] });
      const workspace = admin.organization;
      const builders = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          await createUser(app, {
            email: `${prefix}-b${n}@tooljet.io`,
            groups: ['builder'],
            organization: workspace,
          })
        );
      }
      const endUser = await createUser(app, {
        email: `${prefix}-end@tooljet.io`,
        groups: ['end-user'],
        organization: workspace,
      });
      const builder = builders[0].user as User;
      const as = async (user: User): Promise<Caller> => ({
        app,
        cookie: await sessionFor(user, workspace.id),
        organizationId: workspace.id,
      });
      licenseWith(app, { aiPlan: 'credits' });
      return {
        workspace,
        builder,
        endUser: endUser.user as User,
        admin: await as(admin.user),
        asBuilder: await as(builder),
        as,
        owner: `/api/ai/organizations/${workspace.id}`,
      };
    }

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

    /** Agent calls end at the agent boundary so routes that proceed finish quickly; run starts are watched. */
    const stubAgents = () => {
      const util = routeUtil(app);
      jest.spyOn(util, 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [], code: '' }]);
      jest.spyOn(util, 'callAgent').mockResolvedValue([new Error('agent stubbed'), null]);
      jest.spyOn(util, 'beginActiveRun');
      jest.spyOn(util, 'withActiveRun');
    };

    /** A refused action never starts a run (runs delete themselves, so a row count can't prove this). */
    const expectNoRunStarted = () => {
      expect(routeUtil(app).beginActiveRun).not.toHaveBeenCalled();
      expect(routeUtil(app).withActiveRun).not.toHaveBeenCalled();
    };

    describe('AC1: a builder at their limit is refused on every route with no active run', () => {
      const routes: [string, (s: Awaited<ReturnType<typeof seed>>) => Promise<request.Response>, 'sse' | 'http'][] = [
        [
          'message',
          async (s) =>
            post(s.asBuilder, 'conversation/message', {
              conversationId: await conversationFor(app, s.builder, 'generate'),
              content: 'build me an app',
            }),
          'sse',
        ],
        [
          'docs-message',
          async (s) =>
            post(s.asBuilder, 'conversation/docs-message', {
              conversationId: await conversationFor(app, s.builder, 'learn'),
              content: 'how do I add a table?',
            }),
          'sse',
        ],
        [
          'fix-with-ai',
          (s) => post(s.asBuilder, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' }),
          'http',
        ],
        [
          'autosort',
          (s) =>
            post(s.asBuilder, 'autosort', { queries: [{ id: uuidv4(), name: 'q1', kind: 'restapi' }], folders: [] }),
          'http',
        ],
        [
          'copilot',
          (s) => post(s.asBuilder, 'copilot', { prompt: 'sum', context: '', language: 'javascript' }),
          'http',
        ],
      ];

      it.each(routes)('%s', async (_name, call, shape) => {
        const s = await seed(`ac1${uuidv4().slice(0, 6)}`);
        stubAgents();
        stubGateway(gatewayFor(s.owner, POOL, { [s.builder.id]: LIMIT }));
        await setLimits(s.admin, true);

        const res = await call(s);

        if (shape === 'sse') {
          expect(sseRefusalMessage(res.text)?.metadata.category).toBe('credit_limit_reached');
          expect(res.text).not.toContain('event: generation');
        } else {
          expect(res.statusCode).toBe(402);
          expect(res.body.code).toBe('credit_limit_reached');
        }
        expectNoRunStarted();
        expect(routeUtil(app).callAgentLegacy).not.toHaveBeenCalled();
      });
    });

    it('a new workspace (no admin action) enforces equal share: a builder over it gets 402', async () => {
      const s = await seed('newws');
      stubAgents();
      stubGateway(gatewayFor(s.owner, POOL, { [s.builder.id]: LIMIT }));

      const res = await post(s.asBuilder, 'autosort', {
        queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }],
        folders: [],
      });

      expect(res.statusCode).toBe(402);
      expect(res.body.code).toBe('credit_limit_reached');
      expectNoRunStarted();
    });

    it('AC2: a builder at 85% with nothing running sends a message', async () => {
      const s = await seed('ac2e');
      stubAgents();
      stubGateway(gatewayFor(s.owner, POOL, { [s.builder.id]: Math.floor(LIMIT * 0.85) }));
      await setLimits(s.admin, true);

      const res = await post(s.asBuilder, 'conversation/message', {
        conversationId: await conversationFor(app, s.builder, 'generate'),
        content: 'build me an app',
      });

      expect(sseRefusalMessage(res.text)).toBeNull();
      expect(res.text).toContain('event: generation');
    });

    it.each([true, false])(
      'AC3: an empty pool refuses any builder with pool_empty (limits on: %s)',
      async (enabled) => {
        const s = await seed(`ac3e${enabled ? 'on' : 'off'}`);
        stubAgents();
        // Another builder drained the pool; this builder has spent nothing.
        const other = (
          await createUser(app, {
            email: `ac3e${enabled}-drain@tooljet.io`,
            groups: ['builder'],
            organization: s.workspace,
          })
        ).user as User;
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 0 }, { [other.id]: 1000 }));
        await setLimits(s.admin, enabled);

        const message = await post(s.asBuilder, 'conversation/message', {
          conversationId: await conversationFor(app, s.builder, 'generate'),
          content: 'build me an app',
        });
        const autosort = await post(s.asBuilder, 'autosort', {
          queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }],
          folders: [],
        });

        expect(sseRefusalMessage(message.text)?.metadata.category).toBe('pool_empty');
        // PRD builder copy, sentence-case title; buying stays on the admin's action button.
        expect(message.text).toMatch(/Your (instance|workspace) is out of AI credits\. Ask your admin to add more\./);
        expect(message.text).toContain('Out of AI credits');
        expect(message.text).not.toContain('Insufficient Credits');
        expect(autosort.statusCode).toBe(402);
        expect(autosort.body.code).toBe('pool_empty');
        // Same pool-empty copy whatever the toggle (PRD state table).
        const copy = 'Your workspace is out of AI credits. Ask your admin to add more.';
        expect(sseRefusalMessage(message.text)?.content).toBe(copy);
        expect(autosort.body.message).toBe(copy);
        expectNoRunStarted();
      }
    );

    it('balance read fails: SSE routes persist a balance_unavailable message, HTTP routes return 503', async () => {
      const s = await seed('ac6r');
      stubAgents();
      stubGateway({});

      const message = await post(s.asBuilder, 'conversation/message', {
        conversationId: await conversationFor(app, s.builder, 'generate'),
        content: 'build me an app',
      });
      const autosort = await post(s.asBuilder, 'autosort', {
        queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }],
        folders: [],
      });

      expect(sseRefusalMessage(message.text)?.metadata.category).toBe('balance_unavailable');
      expect(message.text).not.toContain('event: error');
      expect(autosort.statusCode).toBe(503);
      expect(autosort.body.code).toBe('balance_unavailable');
      expectNoRunStarted();
    });

    it('fix-with-ai has no floor of its own: 2 credits left is not a credits refusal', async () => {
      const s = await seed('fx2c');
      stubAgents();
      stubGateway(gatewayFor(s.owner, { monthly: 2, addon: 0 }));
      await setLimits(s.admin, false);

      const res = await post(s.asBuilder, 'fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' });

      expect(res.statusCode).not.toBe(402);
      expect(routeUtil(app).withActiveRun).toHaveBeenCalled();
    });

    it('AC4: limits off, a builder over the default proceeds while the pool has credits', async () => {
      const s = await seed('ac4e');
      stubAgents();
      stubGateway(gatewayFor(s.owner, POOL, { [s.builder.id]: 600 }));
      await setLimits(s.admin, false);

      const res = await post(s.asBuilder, 'autosort', {
        queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }],
        folders: [],
      });

      expect(res.statusCode).toBe(201);
      expect(routeUtil(app).callAgentLegacy).toHaveBeenCalled();
    });

    it.each([
      ['fix-with-ai', { componentId: uuidv4(), message: 'x', key: 'y' }],
      ['copilot', { prompt: 'sum', context: '', language: 'javascript' }],
    ])('AC7: an end user calling %s gets 403', async (path, body) => {
      const s = await seed(`ac7e${path.slice(0, 3)}`);
      stubAgents();
      stubGateway(gatewayFor(s.owner, POOL));

      const res = await post(await s.as(s.endUser), path, body);

      expect(res.statusCode).toBe(403);
      expect(routeUtil(app).callAgentLegacy).not.toHaveBeenCalled();
    });

    it('AC8: an overshoot shows used above the limit and an overdrawn pool goes below 0 remaining', async () => {
      const s = await seed('ac8e');
      // Pool 2,000 monthly: limit 500 each. The builder's last action overshot to 2,100.
      stubGateway(gatewayFor(s.owner, { monthly: 2000, addon: 0 }, { [s.builder.id]: 2100 }));
      await setLimits(s.admin, true);

      const res = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', s.workspace.id)
        .set('Cookie', s.admin.cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.pools.monthly).toMatchObject({ total: 2000, used: 2100, remaining: -100 });
      const row = res.body.rows.find((r) => r.userId === s.builder.id);
      // No add-on limit: the overshoot stays on monthly.
      expect(row).toMatchObject({ monthly: 2100, addon: 0, limit: { monthly: 500, addon: 0 } });
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s7';
    const owner = `/api/ai/selfhost-customers/${customerId}`;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('a builder at their instance-wide limit is refused', async () => {
      const superAdmin = await createUser(app, {
        email: 'sh7-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const builder = (
        await createUser(app, {
          email: 'sh7-builder@tooljet.io',
          groups: ['builder'],
          organization: superAdmin.organization,
        })
      ).user as User;
      licenseWith(app, {
        aiPlan: 'credits',
        aiEnabled: true,
        ai: { apiKey: 'selfhost-key' },
        metadata: { customerId },
      });
      // 2 builders, pool 1,000: limit 500 each.
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }, { [builder.id]: 500 }));
      const admin: Caller = {
        app,
        cookie: await sessionFor(superAdmin.user, superAdmin.organization.id),
        organizationId: superAdmin.organization.id,
      };
      expect(
        (
          await request(app.getHttpServer())
            .put('/api/ai/credits-usage/limits')
            .set('tj-workspace-id', admin.organizationId)
            .set('Cookie', admin.cookie)
            .send({ enabled: true })
        ).statusCode
      ).toBe(200);
      jest.spyOn(routeUtil(app), 'callAgentLegacy').mockResolvedValue([null, { assignments: [], newFolders: [] }]);

      const res = await post(
        {
          app,
          cookie: await sessionFor(builder, superAdmin.organization.id),
          organizationId: superAdmin.organization.id,
        },
        'autosort',
        { queries: [{ id: uuidv4(), name: 'q', kind: 'restapi' }], folders: [] }
      );

      expect(res.statusCode).toBe(402);
      expect(res.body.code).toBe('credit_limit_reached');
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

    it.each(['fix-with-ai', 'copilot'])('%s is not served', async (path) => {
      const builder = await createUser(app, { email: `ce7-${path}@tooljet.io`, groups: ['builder'] });

      const res = await post(
        {
          app,
          cookie: await sessionFor(builder.user, builder.organization.id),
          organizationId: builder.organization.id,
        },
        path,
        {}
      );

      expect(res.statusCode).toBe(404);
    });
  });
});
