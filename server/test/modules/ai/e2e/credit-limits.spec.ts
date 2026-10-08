import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createUser, getDefaultDataSource, withRealTransactions } from 'test-helper';
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

const defaultRows = (organizationId: string | null) =>
  getDefaultDataSource().query(
    `SELECT pool, mode, value, enabled FROM ai_credit_limits
      WHERE organization_id IS NOT DISTINCT FROM $1::uuid AND user_id IS NULL ORDER BY pool`,
    [organizationId]
  );

const customRows = (userId: string) =>
  getDefaultDataSource().query(
    `SELECT organization_id AS "organizationId", pool, value FROM ai_credit_limits WHERE user_id = $1 ORDER BY pool`,
    [userId]
  );

/** A workspace from before limits went on by default: its rows say off. */
const seedLimitsOff = (organizationId: string | null) =>
  getDefaultDataSource().query(
    `INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled)
     SELECT $1::uuid, NULL, pool, 'equal_share', NULL, false FROM (VALUES ('monthly'), ('addon')) p(pool)`,
    [organizationId]
  );

/** @group ai */
describe('AI credit limits: PUT /api/ai/credits-usage/limits and /limits/builders/:userId', () => {
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

    /** Admin + 3 builders = 4 builders, plus an end user. On 1,000 + 100 each builder gets 250 + 25. */
    async function seed(name: string) {
      const admin = await createUser(app, { email: `${name}-admin@tooljet.io`, groups: ['admin'] });
      const workspace = admin.organization;
      const builders = [];
      for (const n of [1, 2, 3]) {
        builders.push(
          await createUser(app, { email: `${name}-b${n}@tooljet.io`, groups: ['builder'], organization: workspace })
        );
      }
      const endUser = await createUser(app, {
        email: `${name}-end@tooljet.io`,
        groups: ['end-user'],
        organization: workspace,
      });
      return {
        admin,
        workspace,
        builders,
        endUser,
        owner: `/api/ai/organizations/${workspace.id}`,
        cookie: await sessionFor(admin.user, workspace.id),
        userIds: [admin, ...builders, endUser].map((u) => u.user.id),
      };
    }

    const getUsage = (cookie: string[], organizationId: string) =>
      request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie);

    const putLimits = (cookie: string[], organizationId: string, body: object) =>
      request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send(body);

    const putBuilderLimit = (cookie: string[], organizationId: string, userId: string, body: object) =>
      request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${userId}`)
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send(body);

    const archive = (cookie: string[], organizationId: string, organizationUserId: string) =>
      request(app.getHttpServer())
        .post(`/api/organization-users/${organizationUserId}/archive`)
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send({});

    const makeEndUser = (cookie: string[], organizationId: string, userId: string) =>
      request(app.getHttpServer())
        .put('/api/v2/group-permissions/role/user')
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send({ newRole: 'end-user', userId });

    describe('PUT /api/ai/credits-usage/limits', () => {
      it('a new workspace has limits on with an equal share before any admin acts', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }, {}, { plan: { monthly: 1000, addon: 100 } }));

        const res = await getUsage(s.cookie, s.workspace.id);

        expect(res.statusCode).toBe(200);
        expect(res.body.limits).toMatchObject({
          enabled: true,
          builderCount: 4,
          customCount: 0,
          monthly: { mode: 'equal_share', value: null, max: 250, effective: 250 },
          addon: { mode: 'equal_share', value: null, max: 25, effective: 25 },
        });
        expect(res.body.rows.find((r) => r.userId === s.builders[0].user.id).limit).toEqual({
          monthly: 250,
          addon: 25,
        });
        // The first read records the plan sizes; the rows it writes stay on.
        expect(await defaultRows(s.workspace.id)).toEqual([
          { pool: 'addon', mode: 'equal_share', value: null, enabled: true },
          { pool: 'monthly', mode: 'equal_share', value: null, enabled: true },
        ]);
      });

      it('turning a new workspace off saves both rows off and logs DISABLED only', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

        const res = await putLimits(s.cookie, s.workspace.id, { enabled: false });

        expect(res.statusCode).toBe(200);
        expect(await defaultRows(s.workspace.id)).toEqual([
          { pool: 'addon', mode: 'equal_share', value: null, enabled: false },
          { pool: 'monthly', mode: 'equal_share', value: null, enabled: false },
        ]);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_DISABLED', 1)).toHaveLength(1);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_ENABLED', 0)).toEqual([]);
      });

      it('a custom default shrinks when a builder joins and returns when they leave', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        await putLimits(s.cookie, s.workspace.id, {
          defaults: { monthly: { mode: 'custom', value: 250 }, addon: { mode: 'equal_share' } },
        }).expect(200);

        const joiner = await createUser(app, {
          email: 'joiner@tooljet.io',
          groups: ['builder'],
          organization: s.workspace,
        });
        const joined = (await getUsage(s.cookie, s.workspace.id)).body.limits;
        await getDefaultDataSource().query(`UPDATE organization_users SET status = 'archived' WHERE user_id = $1`, [
          joiner.user.id,
        ]);
        const left = (await getUsage(s.cookie, s.workspace.id)).body.limits;

        // 5 builders on 1,000: 200 each.
        expect(joined).toMatchObject({
          builderCount: 5,
          monthly: { mode: 'custom', value: 250, effective: 200, note: 'reduced' },
        });
        expect(left).toMatchObject({
          builderCount: 4,
          monthly: { mode: 'custom', value: 250, effective: 250, note: null },
        });
      });

      it('a custom default over the per-builder max is refused with 400 and nothing is saved', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

        const res = await putLimits(s.cookie, s.workspace.id, {
          enabled: true,
          defaults: { monthly: { mode: 'custom', value: 251 }, addon: { mode: 'equal_share' } },
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Cannot allocate more than 250 per builder');
        expect(await defaultRows(s.workspace.id)).toEqual([]);
      });

      it('a zero, fractional or empty body is refused with 400 and nothing is saved', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

        const zero = await putLimits(s.cookie, s.workspace.id, {
          defaults: { monthly: { mode: 'custom', value: 0 }, addon: { mode: 'equal_share' } },
        });
        const fraction = await putLimits(s.cookie, s.workspace.id, {
          defaults: { monthly: { mode: 'custom', value: 1.5 }, addon: { mode: 'equal_share' } },
        });
        const empty = await putLimits(s.cookie, s.workspace.id, {});

        expect(zero.statusCode).toBe(400);
        expect(zero.body.message).toEqual(['defaults.monthly.Enter a whole number of 1 or more.']);
        expect(fraction.statusCode).toBe(400);
        expect(fraction.body.message).toEqual(['defaults.monthly.Enter a whole number of 1 or more.']);
        expect(empty.statusCode).toBe(400);
        expect(empty.body.message).toEqual(['enabled must be a boolean value']);
        expect(await defaultRows(s.workspace.id)).toEqual([]);
      });

      // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
      it('saves racing from off: ENABLED is logged once and each UPDATED sees the save before it', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`race-${uuidv4().slice(0, 6)}`);
          try {
            await seedLimitsOff(s.workspace.id);
            stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

            const results = await Promise.all(
              [110, 120, 130, 140, 150].map((value) =>
                putLimits(s.cookie, s.workspace.id, {
                  enabled: true,
                  defaults: { monthly: { mode: 'custom', value }, addon: { mode: 'equal_share' } },
                })
              )
            );

            expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200, 200, 200]);
            // Without the lock every save reads "off, equal share", so each logs ENABLED.
            expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_ENABLED', 1)).toHaveLength(1);
            const updates = await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_UPDATED', 5);
            expect(updates).toHaveLength(5);
            expect(updates.filter((r) => r.metadata.before.monthly.mode === 'equal_share')).toHaveLength(1);
          } finally {
            await dropSeed(s.workspace.id, s.userIds);
          }
        });
      });

      it('saving defaults alone keeps limits off', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        await putLimits(s.cookie, s.workspace.id, { enabled: false }).expect(200);

        const res = await putLimits(s.cookie, s.workspace.id, {
          defaults: { monthly: { mode: 'custom', value: 120 }, addon: { mode: 'equal_share' } },
        });

        expect(res.statusCode).toBe(200);
        expect(await defaultRows(s.workspace.id)).toEqual([
          { pool: 'addon', mode: 'equal_share', value: null, enabled: false },
          { pool: 'monthly', mode: 'custom', value: 120, enabled: false },
        ]);
      });

      it("turning limits off and on keeps the saved default and every builder's custom limit", async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const builder = s.builders[0].user.id;
        await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400 }).expect(200);
        await putLimits(s.cookie, s.workspace.id, {
          defaults: { monthly: { mode: 'custom', value: 150 }, addon: { mode: 'equal_share' } },
        }).expect(200);

        await putLimits(s.cookie, s.workspace.id, { enabled: false }).expect(200);
        const off = (await getUsage(s.cookie, s.workspace.id)).body;
        await putLimits(s.cookie, s.workspace.id, { enabled: true }).expect(200);
        const on = (await getUsage(s.cookie, s.workspace.id)).body;

        expect(off.limits).toMatchObject({ enabled: false, customCount: 1, monthly: { mode: 'custom', value: 150 } });
        expect(on.limits).toMatchObject({
          enabled: true,
          customCount: 1,
          monthly: { mode: 'custom', value: 150, effective: 150 },
          addon: { mode: 'equal_share' },
        });
        expect(on.rows.find((r) => r.userId === builder).limit).toEqual({ monthly: 400, addon: 25 });
        expect(await customRows(builder)).toEqual([{ organizationId: s.workspace.id, pool: 'monthly', value: 400 }]);
      });

      it('a builder or end user cannot change limits (403)', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

        const builder = await putLimits(await sessionFor(s.builders[0].user, s.workspace.id), s.workspace.id, {
          enabled: false,
        });
        const endUser = await putLimits(await sessionFor(s.endUser.user, s.workspace.id), s.workspace.id, {
          enabled: false,
        });

        expect(builder.statusCode).toBe(403);
        expect(endUser.statusCode).toBe(403);
        expect(await defaultRows(s.workspace.id)).toEqual([]);
      });

      it('turning on logs ENABLED with the builders over the limit and UPDATED; turning off logs DISABLED', async () => {
        const s = await seed('sales');
        await seedLimitsOff(s.workspace.id);
        // A default of 100 + 25: two builders have used 200, the admin 5.
        stubGateway(
          gatewayFor(
            s.owner,
            { monthly: 1000, addon: 100 },
            { [s.builders[0].user.id]: 200, [s.builders[1].user.id]: 200, [s.admin.user.id]: 5 }
          )
        );

        await putLimits(s.cookie, s.workspace.id, {
          enabled: true,
          defaults: { monthly: { mode: 'custom', value: 100 }, addon: { mode: 'equal_share' } },
        }).expect(200);
        await putLimits(s.cookie, s.workspace.id, { enabled: false }).expect(200);

        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_ENABLED', 1)).toEqual([
          { userId: s.admin.user.id, metadata: expect.objectContaining({ buildersOverLimit: 2 }) },
        ]);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_UPDATED', 1)).toEqual([
          {
            userId: s.admin.user.id,
            metadata: expect.objectContaining({
              before: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
              after: { monthly: { mode: 'custom', value: 100 }, addon: { mode: 'equal_share' } },
            }),
          },
        ]);
        expect(await auditRows(s.workspace.id, 'AI_CREDIT_LIMIT_DISABLED', 1)).toEqual([
          { userId: s.admin.user.id, metadata: expect.objectContaining({ workspace_level: true }) },
        ]);
      });

      it("workspace A's save never touches workspace B", async () => {
        const sales = await seed('sales');
        const finance = await seed('finance');
        stubGateway({
          ...gatewayFor(sales.owner, { monthly: 1000, addon: 100 }),
          ...gatewayFor(finance.owner, { monthly: 1000, addon: 100 }),
        });

        await putLimits(sales.cookie, sales.workspace.id, { enabled: false }).expect(200);

        expect(await defaultRows(finance.workspace.id)).toEqual([]);
        expect((await getUsage(finance.cookie, finance.workspace.id)).body.limits.enabled).toBe(true);
      });

      it('on a Team licence both saves are refused (451) and nothing is saved', async () => {
        const s = await seed('team');
        restoreLicence = useLicence(app, TEAM_TERMS);
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));

        const toggle = await putLimits(s.cookie, s.workspace.id, { enabled: false });
        const custom = await putBuilderLimit(s.cookie, s.workspace.id, s.builders[0].user.id, { monthly: 100 });

        expect(toggle.statusCode).toBe(451);
        expect(custom.statusCode).toBe(451);
        expect(await defaultRows(s.workspace.id)).toEqual([]);
        expect(await customRows(s.builders[0].user.id)).toEqual([]);
      });
    });

    describe('PUT /api/ai/credits-usage/limits/builders/:userId', () => {
      it("a custom limit lowers everyone else's default; resetting it restores the default", async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const builder = s.builders[0].user.id;

        await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400, addon: null }).expect(200);
        const saved = (await getUsage(s.cookie, s.workspace.id)).body;
        const savedRows = await customRows(builder);
        await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: null, addon: null }).expect(200);
        const reset = (await getUsage(s.cookie, s.workspace.id)).body;

        // 1,000 − 400 over the 3 others: 200 each.
        expect(saved.limits).toMatchObject({ customCount: 1, monthly: { effective: 200 } });
        expect(saved.rows.find((r) => r.userId === builder)).toMatchObject({
          customLimit: { monthly: 400 },
          limit: { monthly: 400, addon: 25 },
        });
        expect(saved.rows.find((r) => r.userId === s.builders[1].user.id).customLimit).toBeUndefined();
        expect(savedRows).toEqual([{ organizationId: s.workspace.id, pool: 'monthly', value: 400 }]);
        expect(reset.limits).toMatchObject({ customCount: 0, monthly: { effective: 250 } });
        expect(reset.rows.find((r) => r.userId === builder).customLimit).toBeUndefined();
        expect(await customRows(builder)).toEqual([]);
      });

      it('a value over the max or not a whole number is refused with 400', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const builder = s.builders[0].user.id;

        // The 3 other builders keep at least 1 credit each: the max is 1,000 − 3.
        const over = await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 998 });
        const zero = await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 0 });
        const fraction = await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 1.5 });
        const rowsAfterRefusals = await customRows(builder);
        const atMax = await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 997 });

        expect(over.statusCode).toBe(400);
        expect(over.body.message).toBe('Cannot allocate more than 997 per builder');
        expect(zero.statusCode).toBe(400);
        expect(zero.body.message).toEqual(['Enter a whole number of 1 or more.']);
        expect(fraction.statusCode).toBe(400);
        expect(fraction.body.message).toEqual(['Enter a whole number of 1 or more.']);
        expect(rowsAfterRefusals).toEqual([]);
        expect(atMax.statusCode).toBe(200);
      });

      it("an end user, another workspace's builder or an unknown user is 404", async () => {
        const sales = await seed('sales');
        const finance = await seed('finance');
        stubGateway(gatewayFor(sales.owner, { monthly: 1000, addon: 100 }));
        const unknownUserId = uuidv4();

        const endUser = await putBuilderLimit(sales.cookie, sales.workspace.id, sales.endUser.user.id, {
          monthly: 100,
        });
        const otherWorkspace = await putBuilderLimit(sales.cookie, sales.workspace.id, finance.builders[0].user.id, {
          monthly: 100,
        });
        const unknown = await putBuilderLimit(sales.cookie, sales.workspace.id, unknownUserId, { monthly: 100 });

        expect(endUser.statusCode).toBe(404);
        expect(otherWorkspace.statusCode).toBe(404);
        expect(unknown.statusCode).toBe(404);
        expect(await customRows(sales.endUser.user.id)).toEqual([]);
        expect(await customRows(finance.builders[0].user.id)).toEqual([]);
        expect(await customRows(unknownUserId)).toEqual([]);
      });

      it('a builder or end user cannot set a custom limit (403)', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const target = s.builders[0].user.id;

        const builder = await putBuilderLimit(
          await sessionFor(s.builders[1].user, s.workspace.id),
          s.workspace.id,
          target,
          {
            monthly: 100,
          }
        );
        const endUser = await putBuilderLimit(
          await sessionFor(s.endUser.user, s.workspace.id),
          s.workspace.id,
          target,
          {
            monthly: 100,
          }
        );

        expect(builder.statusCode).toBe(403);
        expect(endUser.statusCode).toBe(403);
        expect(await customRows(target)).toEqual([]);
      });

      it('each changed pool logs one BUILDER_LIMIT_UPDATED with the actor, builder, before and after', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const builder = s.builders[0].user;

        await putBuilderLimit(s.cookie, s.workspace.id, builder.id, { monthly: 400 }).expect(200);
        await putBuilderLimit(s.cookie, s.workspace.id, builder.id, { monthly: 400, addon: 20 }).expect(200);
        // Same values again: nothing changed, nothing logged.
        await putBuilderLimit(s.cookie, s.workspace.id, builder.id, { monthly: 400, addon: 20 }).expect(200);

        expect(await auditRows(s.workspace.id, 'AI_CREDIT_BUILDER_LIMIT_UPDATED', 2)).toEqual([
          {
            userId: s.admin.user.id,
            metadata: expect.objectContaining({
              builderId: builder.id,
              builderEmail: 'sales-b1@tooljet.io',
              pool: 'monthly',
              before: null,
              after: 400,
            }),
          },
          {
            userId: s.admin.user.id,
            metadata: expect.objectContaining({
              builderId: builder.id,
              builderEmail: 'sales-b1@tooljet.io',
              pool: 'addon',
              before: null,
              after: 20,
            }),
          },
        ]);
      });
    });

    describe('a builder who loses access loses their custom limit', () => {
      // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
      it('a save racing an archive never leaves a custom limit behind', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`race-${uuidv4().slice(0, 6)}`);
          try {
            stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
            const builder = s.builders[0];

            const [save, archived] = await Promise.all([
              putBuilderLimit(s.cookie, s.workspace.id, builder.user.id, { monthly: 400 }),
              archive(s.cookie, s.workspace.id, builder.orgUser.id),
            ]);

            expect(archived.statusCode).toBe(201);
            // Either the save went first (and the archive removed it) or it found no builder.
            expect([200, 404]).toContain(save.statusCode);
            expect(await customRows(builder.user.id)).toEqual([]);
          } finally {
            await dropSeed(s.workspace.id, s.userIds);
          }
        });
      });

      it('archiving a builder or making them an end user removes their custom limit', async () => {
        const s = await seed('sales');
        stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
        const [archived, demoted] = s.builders;
        await putBuilderLimit(s.cookie, s.workspace.id, archived.user.id, { monthly: 400 }).expect(200);
        await putBuilderLimit(s.cookie, s.workspace.id, demoted.user.id, { monthly: 300 }).expect(200);

        const archive201 = await archive(s.cookie, s.workspace.id, archived.orgUser.id);
        const demote200 = await makeEndUser(s.cookie, s.workspace.id, demoted.user.id);
        const limits = (await getUsage(s.cookie, s.workspace.id)).body.limits;

        expect(archive201.statusCode).toBe(201);
        expect(demote200.statusCode).toBe(200);
        expect(await customRows(archived.user.id)).toEqual([]);
        expect(await customRows(demoted.user.id)).toEqual([]);
        // Admin + 1 builder left, no custom limits: 1,000 ÷ 2.
        expect(limits).toMatchObject({ builderCount: 2, customCount: 0, monthly: { effective: 500 } });
      });

      // Failure injected at our own listener: no other way to make the cleanup fail.
      it('if removing the custom limit fails, the archive and the role change fail with 500 and nothing changes', async () => {
        await withRealTransactions(async () => {
          const s = await seed(`failing-${uuidv4().slice(0, 6)}`);
          try {
            stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
            const [archived, demoted] = s.builders;
            await putBuilderLimit(s.cookie, s.workspace.id, archived.user.id, { monthly: 400 }).expect(200);
            await putBuilderLimit(s.cookie, s.workspace.id, demoted.user.id, { monthly: 300 }).expect(200);
            jest
              .spyOn(app.get(BuilderUsageService), 'removeLostBuilderLimits')
              .mockRejectedValue(new Error('cleanup failed'));

            const archive500 = await archive(s.cookie, s.workspace.id, archived.orgUser.id);
            const demote500 = await makeEndUser(s.cookie, s.workspace.id, demoted.user.id);

            expect(archive500.statusCode).toBe(500);
            expect(demote500.statusCode).toBe(500);
            const [{ status }] = await getDefaultDataSource().query(
              'SELECT status FROM organization_users WHERE id = $1',
              [archived.orgUser.id]
            );
            expect(status).toBe('active');
            expect(await customRows(archived.user.id)).toEqual([
              { organizationId: s.workspace.id, pool: 'monthly', value: 400 },
            ]);
            expect(await customRows(demoted.user.id)).toEqual([
              { organizationId: s.workspace.id, pool: 'monthly', value: 300 },
            ]);
            expect((await getUsage(s.cookie, s.workspace.id)).body.limits).toMatchObject({
              builderCount: 4,
              customCount: 2,
            });
          } finally {
            await dropSeed(s.workspace.id, s.userIds);
          }
        });
      });

      describe('through the external API', () => {
        const previous = { enabled: process.env.ENABLE_EXTERNAL_API, token: process.env.EXTERNAL_API_ACCESS_TOKEN };

        beforeAll(() => {
          process.env.ENABLE_EXTERNAL_API = 'true';
          process.env.EXTERNAL_API_ACCESS_TOKEN = 'external-token';
        });

        afterAll(() => {
          process.env.ENABLE_EXTERNAL_API = previous.enabled;
          process.env.EXTERNAL_API_ACCESS_TOKEN = previous.token;
        });

        it('archiving a user through PATCH /ext/user/:id removes their custom limit', async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const builder = s.builders[0].user.id;
          await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400 }).expect(200);

          const res = await request(app.getHttpServer())
            .patch(`/api/ext/user/${builder}`)
            .set('Authorization', 'Basic external-token')
            .send({ status: 'archived' });

          expect(res.statusCode).toBe(200);
          expect(await customRows(builder)).toEqual([]);
        });

        it('archiving a user in one workspace through PATCH /ext/user/:id/workspace/:id removes their custom limit', async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const builder = s.builders[0].user.id;
          await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400 }).expect(200);

          const res = await request(app.getHttpServer())
            .patch(`/api/ext/user/${builder}/workspace/${s.workspace.id}`)
            .set('Authorization', 'Basic external-token')
            .send({ status: 'archived' });

          expect(res.statusCode).toBe(200);
          expect(await customRows(builder)).toEqual([]);
        });

        it('making a user an end user through PUT /ext/user/:id/workspaces removes their custom limit', async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const builder = s.builders[0].user.id;
          await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400 }).expect(200);

          const res = await request(app.getHttpServer())
            .put(`/api/ext/user/${builder}/workspaces`)
            .set('Authorization', 'Basic external-token')
            .send([{ id: s.workspace.id, role: 'end-user' }]);

          expect(res.statusCode).toBe(200);
          expect(await customRows(builder)).toEqual([]);
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

    it('a super admin saves one instance-wide default, logged instance-level', async () => {
      const superAdmin = await createUser(app, { email: 'super@tooljet.io', userType: 'instance', groups: ['admin'] });
      await createUser(app, { email: 'other-admin@tooljet.io', groups: ['admin'], organizationName: 'Other' });
      const workspaceId = superAdmin.organization.id;
      const cookie = await sessionFor(superAdmin.user, workspaceId);
      await seedLimitsOff(null);
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));

      const res = await request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({ enabled: true });
      const usage = await request(app.getHttpServer())
        .get('/api/ai/credits-usage')
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie);

      expect(res.statusCode).toBe(200);
      expect(await defaultRows(null)).toEqual([
        { pool: 'addon', mode: 'equal_share', value: null, enabled: true },
        { pool: 'monthly', mode: 'equal_share', value: null, enabled: true },
      ]);
      expect(await defaultRows(workspaceId)).toEqual([]);
      // Both workspace admins are builders on the instance: 1,000 ÷ 2.
      expect(usage.body.limits).toMatchObject({ enabled: true, builderCount: 2, monthly: { effective: 500 } });
      const [enabled] = await auditRows(workspaceId, 'AI_CREDIT_LIMIT_ENABLED', 1);
      expect(enabled.metadata).toMatchObject({ instance_level: true });
    });

    it('a builder archived in one of two workspaces keeps their custom limit; archived everywhere loses it', async () => {
      const superAdmin = await createUser(app, { email: 'super@tooljet.io', userType: 'instance', groups: ['admin'] });
      const other = await createUser(app, {
        email: 'other-admin@tooljet.io',
        groups: ['admin'],
        organizationName: 'Other',
      });
      const inHome = await createUser(app, {
        email: 'builder@tooljet.io',
        groups: ['builder'],
        organization: superAdmin.organization,
      });
      const inOther = await createUser(app, { groups: ['builder'], organization: other.organization }, inHome.user);
      const workspaceId = superAdmin.organization.id;
      const cookie = await sessionFor(superAdmin.user, workspaceId);
      const builderId = inHome.user.id;
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));

      await request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${builderId}`)
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({ monthly: 400, addon: null })
        .expect(200);
      const saved = await customRows(builderId);
      const archiveOne = await request(app.getHttpServer())
        .post(`/api/organization-users/${inOther.orgUser.id}/archive`)
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({ organizationId: other.organization.id });
      const afterOne = await customRows(builderId);
      const archiveAll = await request(app.getHttpServer())
        .post(`/api/organization-users/${builderId}/archive-all`)
        .set('tj-workspace-id', workspaceId)
        .set('Cookie', cookie)
        .send({});

      expect(saved).toEqual([{ organizationId: null, pool: 'monthly', value: 400 }]);
      expect(archiveOne.statusCode).toBe(201);
      expect(afterOne).toEqual([{ organizationId: null, pool: 'monthly', value: 400 }]);
      expect(archiveAll.statusCode).toBe(201);
      expect(await customRows(builderId)).toEqual([]);
      const [entry] = await auditRows(workspaceId, 'AI_CREDIT_BUILDER_LIMIT_UPDATED', 1);
      expect(entry.metadata).toMatchObject({ instance_level: true, pool: 'monthly', before: null, after: 400 });
    });

    it('a workspace admin who is not a super admin cannot change limits (403)', async () => {
      const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['admin'] });
      stubGateway(gatewayFor(owner, { monthly: 1000, addon: 0 }));

      const res = await request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', await sessionFor(admin.user, admin.organization.id))
        .send({ enabled: true });

      expect(res.statusCode).toBe(403);
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

    it('limit endpoints are not served (404)', async () => {
      const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['admin'] });
      const cookie = await sessionFor(admin.user, admin.organization.id);

      const limits = await request(app.getHttpServer())
        .put('/api/ai/credits-usage/limits')
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', cookie)
        .send({ enabled: true });
      const builderLimit = await request(app.getHttpServer())
        .put(`/api/ai/credits-usage/limits/builders/${admin.user.id}`)
        .set('tj-workspace-id', admin.organization.id)
        .set('Cookie', cookie)
        .send({ monthly: 1, addon: null });

      expect(limits.statusCode).toBe(404);
      expect(builderLimit.statusCode).toBe(404);
    });
  });
});
