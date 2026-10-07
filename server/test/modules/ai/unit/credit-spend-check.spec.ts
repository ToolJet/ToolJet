import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { metrics, Meter } from '@opentelemetry/api';
import { initTestApp, closeTestApp, createUser, buildTestSession } from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';
import { AiController } from '@ee/ai/controller';
import { AiService } from '@ee/ai/service';
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';
import * as creditLimits from '@ee/ai/services/credit-limits';

const GATEWAY = 'http://gateway.test';
const wallet = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

/** Gateway stub: balance answers, fails or hangs; usage hangs forever when asked to. */
function stubGateway(
  owner: string,
  opts: { balance: 'ok' | 'down' | 'hang'; usage: 'ok' | 'hang'; spend?: number; userId?: string }
) {
  const realFetch = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (!url.startsWith(GATEWAY)) return realFetch(input, init);
    const path = url.slice(GATEWAY.length);
    const spent = opts.spend ?? 0;
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    if (path === `${owner}/balance`) {
      if (opts.balance === 'down') throw new TypeError('fetch failed');
      if (opts.balance === 'hang') return new Promise<Response>(() => undefined);
      return json({ balance: 1000 - spent, remaining: wallet(1000 - spent), expiry: {}, cycleStart: null });
    }
    if (path === `${owner}/usage`) {
      if (opts.usage === 'hang') return new Promise<Response>(() => undefined);
      const users = opts.userId ? [{ userId: opts.userId, ...wallet(spent) }] : [];
      return json({ cycleStart: null, trackingSince: null, users, unattributed: wallet(0), pool: wallet(spent) });
    }
    return new Response('{}', { status: 404 });
  });
}

/** Services the routes actually use (the module graph holds more than one instance). */
const routeServices = (app: INestApplication) =>
  app.get(AiController) as unknown as { aiService: AiService; builderUsageService: BuilderUsageService };

const setBudget = (app: INestApplication, ms: number) =>
  ((routeServices(app).builderUsageService as unknown as { spendCheckTimeoutMs: number }).spendCheckTimeoutMs = ms);

/** @group ai */
describe('AI spend check (AC6)', () => {
  let app: INestApplication;
  let budget: number;
  const previous = { gateway: process.env.TJ_AI_GATEWAY_URL, features: process.env.ENABLE_AI_FEATURES };
  // The fail-open counter is created once and cached, so every test shares one fake.
  const add = jest.fn();

  beforeAll(async () => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
    process.env.ENABLE_AI_FEATURES = 'true';
    ({ app } = await initTestApp({ edition: 'cloud', plan: 'enterprise' }));
    process.env.TOOLJET_EDITION = 'cloud';
    budget = (routeServices(app).builderUsageService as unknown as { spendCheckTimeoutMs: number }).spendCheckTimeoutMs;
  });

  beforeEach(() => {
    add.mockClear();
    jest.spyOn(metrics, 'getMeter').mockReturnValue({ createCounter: () => ({ add }) } as unknown as Meter);
  });

  afterAll(async () => {
    process.env.TJ_AI_GATEWAY_URL = previous.gateway;
    process.env.ENABLE_AI_FEATURES = previous.features;
    await closeTestApp(app);
  }, 60_000);

  afterEach(() => {
    jest.restoreAllMocks();
    setBudget(app, budget);
  });

  /** Admin + 1 builder share a 1,000 pool: limit 500 each. */
  async function seedWithLimitsOn(prefix: string) {
    const admin = await createUser(app, { email: `${prefix}-admin@tooljet.io`, groups: ['end-user', 'admin'] });
    const user = (
      await createUser(app, {
        email: `${prefix}-builder@tooljet.io`,
        groups: ['builder'],
        organization: admin.organization,
      })
    ).user as User;
    const owner = `/api/ai/organizations/${admin.organization.id}`;
    const lts = app.get(LicenseTermsService);
    const original = lts.getLicenseTerms.bind(lts);
    jest
      .spyOn(lts, 'getLicenseTerms')
      .mockImplementation(async (fields: unknown, organizationId?: string) =>
        fields === 'aiPlan' || (Array.isArray(fields) && fields.includes('aiPlan'))
          ? Array.isArray(fields)
            ? { ...((await original(fields, organizationId)) as object), aiPlan: 'credits' }
            : 'credits'
          : original(fields, organizationId)
      );
    stubGateway(owner, { balance: 'ok', usage: 'ok' });
    const cookie = (await buildTestSession(admin.user, admin.organization.id)).tokenCookie;
    const res = await request(app.getHttpServer())
      .put('/api/ai/credits-usage/limits')
      .set('tj-workspace-id', admin.organization.id)
      .set('Cookie', cookie)
      .send({ enabled: true });
    expect(res.statusCode).toBe(200);
    (global.fetch as jest.Mock).mockRestore();
    return { user: Object.assign(user, { organizationId: admin.organization.id }), owner };
  }

  it('usage read times out: the action proceeds (run cap only) and the fail-open metric increments', async () => {
    const { user, owner } = await seedWithLimitsOn('ac6t');
    stubGateway(owner, { balance: 'ok', usage: 'hang' });
    setBudget(app, 50);

    await expect(routeServices(app).aiService.checkSpend(user)).resolves.toEqual({
      refusal: null,
      gate: { leftPercent: null },
    });
    expect(add).toHaveBeenCalledWith(1);
  });

  it('usage read answers in time: a builder at the limit is refused, no metric', async () => {
    const { user, owner } = await seedWithLimitsOn('ac6l');
    stubGateway(owner, { balance: 'ok', usage: 'ok', spend: 500, userId: user.id });

    await expect(routeServices(app).aiService.checkSpend(user)).resolves.toMatchObject({
      refusal: 'credit_limit_reached',
    });
    expect(add).not.toHaveBeenCalled();
  });

  it('limits read fails: the action proceeds (run cap only) and the fail-open metric increments', async () => {
    const { user, owner } = await seedWithLimitsOn('ac6s');
    stubGateway(owner, { balance: 'ok', usage: 'ok', spend: 500, userId: user.id });
    jest.spyOn(creditLimits, 'loadScopeLimits').mockRejectedValue(new Error('db down'));

    await expect(routeServices(app).aiService.checkSpend(user)).resolves.toEqual({
      refusal: null,
      gate: { leftPercent: null },
    });
    expect(add).toHaveBeenCalledWith(1);
  });

  it('balance read fails: the action is refused with 503', async () => {
    const { user, owner } = await seedWithLimitsOn('ac6b');
    stubGateway(owner, { balance: 'down', usage: 'ok' });

    await expect(routeServices(app).aiService.checkSpend(user)).rejects.toMatchObject({
      status: 503,
      code: 'balance_unavailable',
    });
  });

  it('balance read hangs: refused with 503 within the budget', async () => {
    const { user, owner } = await seedWithLimitsOn('ac6h');
    stubGateway(owner, { balance: 'hang', usage: 'ok' });
    setBudget(app, 50);

    await expect(routeServices(app).aiService.checkSpend(user)).rejects.toMatchObject({
      status: 503,
      code: 'balance_unavailable',
    });
  }, 3_000);
});
