import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, buildTestSession } from 'test-helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { User } from '@entities/user.entity';

const GATEWAY = 'http://gateway.test';
const CYCLE_START = '2026-10-01T00:00:00.000Z';
const RENEWS = '2026-11-01T00:00:00.000Z';
const EXPIRES = '2027-08-02T00:00:00.000Z';

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

/** Pool sizes are remaining + spend, so remaining = pool − Σ spend. Spend is monthly only. */
function gatewayFor(ownerPath: string, pool: { monthly: number; addon: number }, spend: Record<string, number>) {
  const users = Object.entries(spend).map(([userId, monthly]) => ({ userId, ...wallet(monthly) }));
  const used = users.reduce((acc, u) => acc + u.recurring, 0);
  const usage = { cycleStart: CYCLE_START, trackingSince: null, unattributed: wallet(0), pool: wallet(used) };
  return {
    [`${ownerPath}/balance`]: {
      remaining: wallet(pool.monthly - used, pool.addon),
      expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: EXPIRES },
      cycleStart: CYCLE_START,
    },
    [`${ownerPath}/usage`]: { ...usage, users },
    [`${ownerPath}/usage?groupBy=organization`]: { ...usage, users: users.map((u) => ({ ...u, byOrganization: [] })) },
  };
}

const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

const getMine = (app: INestApplication, cookie: string[], organizationId: string, query = '') =>
  request(app.getHttpServer())
    .get(`/api/ai/credits-usage/me${query}`)
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie);

const enableLimits = (app: INestApplication, cookie: string[], organizationId: string) =>
  request(app.getHttpServer())
    .put('/api/ai/credits-usage/limits')
    .set('tj-workspace-id', organizationId)
    .set('Cookie', cookie)
    .send({ enabled: true });

/** @group ai */
describe('GET /api/ai/credits-usage/me', () => {
  const previousGateway = process.env.TJ_AI_GATEWAY_URL;

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
  });

  afterAll(() => {
    process.env.TJ_AI_GATEWAY_URL = previousGateway;
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

    // admin + 2 builders = 3 builders; pool 900/90 → 300/30 each
    async function seed(prefix: string) {
      const admin = await createUser(app, { email: `${prefix}-admin@tooljet.io`, groups: ['end-user', 'admin'] });
      const workspace = admin.organization;
      const a = await createUser(app, {
        email: `${prefix}-a@tooljet.io`,
        groups: ['end-user', 'builder'],
        organization: workspace,
      });
      const b = await createUser(app, {
        email: `${prefix}-b@tooljet.io`,
        groups: ['end-user', 'builder'],
        organization: workspace,
      });
      const endUser = await createUser(app, {
        email: `${prefix}-end@tooljet.io`,
        groups: ['end-user'],
        organization: workspace,
      });
      licenseWith(app, { aiPlan: 'credits' });
      stubGateway(
        gatewayFor(`/api/ai/organizations/${workspace.id}`, { monthly: 900, addon: 90 }, {
          [a.user.id]: 250,
          [b.user.id]: 40,
        })
      );
      return { admin, workspace, a, b, endUser, adminCookie: await sessionFor(admin.user, workspace.id) };
    }

    const aNumbers = {
      enabled: true,
      cycleStart: CYCLE_START,
      monthly: { used: 250, limit: 300, left: 50, renewsOn: RENEWS },
      addon: { used: 0, limit: 30, left: 30, expiresOn: EXPIRES },
    };

    it('AC1: builder A gets only their own numbers', async () => {
      const s = await seed('mc1');
      expect((await enableLimits(app, s.adminCookie, s.workspace.id)).statusCode).toBe(200);

      const res = await getMine(app, await sessionFor(s.a.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(aNumbers);
    });

    it("AC1: asking for another user's numbers is ignored", async () => {
      const s = await seed('mc2');
      await enableLimits(app, s.adminCookie, s.workspace.id);
      const cookie = await sessionFor(s.a.user, s.workspace.id);

      for (const q of [`?userId=${s.b.user.id}`, `?user_id=${s.b.user.id}`, `?id=${s.b.user.id}`]) {
        const res = await getMine(app, cookie, s.workspace.id, q);
        expect(res.body).toEqual(aNumbers);
      }
    });

    it('limits off → enabled false', async () => {
      const s = await seed('mc3');

      const res = await getMine(app, await sessionFor(s.a.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ enabled: false });
    });

    it('AI not on ToolJet credits → enabled false', async () => {
      const s = await seed('mc4');
      await enableLimits(app, s.adminCookie, s.workspace.id);
      jest.restoreAllMocks();
      licenseWith(app, { aiPlan: 'byok' });

      const res = await getMine(app, await sessionFor(s.a.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ enabled: false });
    });

    it('end user gets 403', async () => {
      const s = await seed('mc5');

      const res = await getMine(app, await sessionFor(s.endUser.user, s.workspace.id), s.workspace.id);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Self-hosted (ee)', () => {
    let app: INestApplication;
    const customerId = 'cust-s10';

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('AC1: a builder gets their own instance-wide numbers', async () => {
      const superAdmin = await createUser(app, {
        email: 'mc-sh-super@tooljet.io',
        userType: 'instance',
        groups: ['end-user', 'admin'],
      });
      const builder = await createUser(app, {
        email: 'mc-sh-builder@tooljet.io',
        groups: ['end-user', 'builder'],
        organization: superAdmin.organization,
      });
      licenseWith(app, { aiPlan: 'credits', aiEnabled: true, ai: { apiKey: 'k' }, metadata: { customerId } });
      stubGateway(
        gatewayFor(`/api/ai/selfhost-customers/${customerId}`, { monthly: 1000, addon: 0 }, { [builder.user.id]: 100 })
      );
      const orgId = superAdmin.organization.id;
      expect((await enableLimits(app, await sessionFor(superAdmin.user, orgId), orgId)).statusCode).toBe(200);

      const res = await getMine(app, await sessionFor(builder.user, orgId), orgId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        enabled: true,
        monthly: { used: 100, limit: 500, left: 400 },
        addon: { used: 0, limit: 0, left: 0 },
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

    it('returns 404', async () => {
      const admin = await createUser(app, { email: 'mc-ce-admin@tooljet.io', groups: ['end-user', 'admin'] });

      const res = await getMine(app, await sessionFor(admin.user, admin.organization.id), admin.organization.id);

      expect(res.statusCode).toBe(404);
    });
  });
});
