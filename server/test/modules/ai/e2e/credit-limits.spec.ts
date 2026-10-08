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
import { BuilderUsageService } from '@ee/ai/services/builder-usage.service';

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
describe('AI credit limits', () => {
  const previousGateway = process.env.TJ_AI_GATEWAY_URL;

  beforeAll(() => {
    process.env.TJ_AI_GATEWAY_URL = GATEWAY;
  });

  afterAll(() => {
    if (previousGateway === undefined) delete process.env.TJ_AI_GATEWAY_URL;
    else process.env.TJ_AI_GATEWAY_URL = previousGateway;
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
     * Seeds an admin, 3 builders and an end user. The admin counts as a builder, so 4 builders share the pool.
     * On a 1,000 monthly + 100 add-on pool, each builder gets 250 monthly + 25 add-on.
     */
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

    describe('PUT /api/ai/credits-usage/limits | on/off and defaults', () => {
      describe('when no admin has acted on a new workspace', () => {
        it('should report limits on with an equal share', async () => {
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
      });

      describe('when a new workspace is turned off', () => {
        it('should save both pool rows off and log only AI_CREDIT_LIMIT_DISABLED', async () => {
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
      });

      describe('with a custom default', () => {
        it('should shrink it when a builder joins and restore it when they leave', async () => {
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

          // With a fifth builder, 1,000 ÷ 5 = 200 each: less than the custom 250, so the default is reduced to 200.
          expect(joined).toMatchObject({
            builderCount: 5,
            monthly: { mode: 'custom', value: 250, effective: 200, note: 'reduced' },
          });
          expect(left).toMatchObject({
            builderCount: 4,
            monthly: { mode: 'custom', value: 250, effective: 250, note: null },
          });
        });
      });

      describe('with a custom default over the per-builder max', () => {
        it('should refuse with 400 and save nothing', async () => {
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
      });

      describe('with a zero, fractional or empty body', () => {
        it('should refuse with 400 and save nothing', async () => {
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
      });

      describe('when saves race from off', () => {
        // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
        it('should log AI_CREDIT_LIMIT_ENABLED once, with each AI_CREDIT_LIMIT_UPDATED seeing the save before it', async () => {
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
      });

      describe('when only defaults are saved', () => {
        it('should keep limits off', async () => {
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
      });

      describe('when limits are turned off and on again', () => {
        it("should keep the saved default and every builder's custom limit", async () => {
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
      });

      describe('when a builder or end user saves', () => {
        it('should return 403', async () => {
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
      });

      describe('when limits are turned on and then off', () => {
        it('should log AI_CREDIT_LIMIT_ENABLED with the builders over the limit and AI_CREDIT_LIMIT_UPDATED, then AI_CREDIT_LIMIT_DISABLED', async () => {
          const s = await seed('sales');
          await seedLimitsOff(s.workspace.id);
          // A custom 100 monthly default plus the equal-share 25 add-on gives each builder a 125 limit.
          // Two builders spent 200 each, over that limit; the admin spent 5.
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
      });

      describe('with two workspaces', () => {
        it("should never let workspace A's save touch workspace B", async () => {
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
      });

      describe('on the team plan', () => {
        describe('when an admin saves limits or a custom limit', () => {
          it('should refuse both with 451 and save nothing', async () => {
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
      });
    });

    describe('PUT /api/ai/credits-usage/limits/builders/:userId | custom builder limit', () => {
      describe('when a custom limit is set and then reset', () => {
        it("should lower everyone else's default, then restore it", async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const builder = s.builders[0].user.id;

          await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: 400, addon: null }).expect(200);
          const saved = (await getUsage(s.cookie, s.workspace.id)).body;
          const savedRows = await customRows(builder);
          await putBuilderLimit(s.cookie, s.workspace.id, builder, { monthly: null, addon: null }).expect(200);
          const reset = (await getUsage(s.cookie, s.workspace.id)).body;

          // The builder's custom 400 leaves 600 of the 1,000 for the 3 others: 200 each.
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
      });

      describe('with a value over the max or not a whole number', () => {
        it('should refuse 998, 0 and 1.5 with 400 and accept the max of 997', async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const builder = s.builders[0].user.id;

          // The 3 other builders must keep at least 1 credit each, so the max is 1,000 − 3 = 997.
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
      });

      describe("when the target is an end user, another workspace's builder or an unknown user", () => {
        it('should return 404', async () => {
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
      });

      describe('when a builder or end user saves', () => {
        it('should return 403', async () => {
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
      });

      describe('when a save changes one pool and then the other', () => {
        it('should log one AI_CREDIT_BUILDER_LIMIT_UPDATED per changed pool with the actor, builder, before and after', async () => {
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
    });

    describe('Custom limit removal | when a builder loses access', () => {
      describe('when a save races an archive', () => {
        // Real transactions: inside the suite transaction every request shares one session, so the lock never blocks.
        it('should never leave a custom limit behind', async () => {
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
      });

      describe('when a builder is archived or made an end user', () => {
        it('should remove their custom limit', async () => {
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
          // The admin and 1 builder are left, with no custom limits: 1,000 ÷ 2 = 500 each.
          expect(limits).toMatchObject({ builderCount: 2, customCount: 0, monthly: { effective: 500 } });
        });
      });

      describe('when a bulk upload archives a builder and makes another an end user', () => {
        it('should remove their custom limits and raise the equal share', async () => {
          const s = await seed('sales');
          stubGateway(gatewayFor(s.owner, { monthly: 1000, addon: 100 }));
          const [archived, demoted] = s.builders;
          await putBuilderLimit(s.cookie, s.workspace.id, archived.user.id, { monthly: 400 }).expect(200);
          await putBuilderLimit(s.cookie, s.workspace.id, demoted.user.id, { monthly: 300 }).expect(200);
          const csv =
            'email,user role,status\nsales-b1@tooljet.io,Builder,Archived\nsales-b2@tooljet.io,End User,Active\n';

          const upload = await request(app.getHttpServer())
            .post('/api/organization-users/upload-csv')
            .set('tj-workspace-id', s.workspace.id)
            .set('Cookie', s.cookie)
            .attach('file', Buffer.from(csv), 'users.csv');
          const limits = (await getUsage(s.cookie, s.workspace.id)).body.limits;

          expect(upload.statusCode).toBe(201);
          expect(await customRows(archived.user.id)).toEqual([]);
          expect(await customRows(demoted.user.id)).toEqual([]);
          // The admin and 1 builder are left, with no custom limits: 1,000 ÷ 2 = 500 each.
          expect(limits).toMatchObject({ builderCount: 2, customCount: 0, monthly: { effective: 500 } });
        });
      });

      describe('when removing the custom limit fails', () => {
        // Failure injected at our own listener: no other way to make the cleanup fail.
        it('should fail the archive and the role change with 500 and change nothing', async () => {
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
      });

      describe('when access is removed through the external API', () => {
        const previous = { enabled: process.env.ENABLE_EXTERNAL_API, token: process.env.EXTERNAL_API_ACCESS_TOKEN };

        beforeAll(() => {
          process.env.ENABLE_EXTERNAL_API = 'true';
          process.env.EXTERNAL_API_ACCESS_TOKEN = 'external-token';
        });

        afterAll(() => {
          for (const [key, value] of [
            ['ENABLE_EXTERNAL_API', previous.enabled],
            ['EXTERNAL_API_ACCESS_TOKEN', previous.token],
          ]) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
          }
        });

        it('should remove the custom limit on archive through PATCH /ext/user/:id', async () => {
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

        it('should remove the custom limit on archive in one workspace through PATCH /ext/user/:id/workspace/:id', async () => {
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

        it('should remove the custom limit on demotion to end user through PUT /ext/user/:id/workspaces', async () => {
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

    describe('when a super admin saves a default', () => {
      it('should save one instance-wide default and log it instance-level', async () => {
        const superAdmin = await createUser(app, {
          email: 'super@tooljet.io',
          userType: 'instance',
          groups: ['admin'],
        });
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
        // Both workspace admins count as builders on the instance: 1,000 ÷ 2 = 500 each.
        expect(usage.body.limits).toMatchObject({ enabled: true, builderCount: 2, monthly: { effective: 500 } });
        const [enabled] = await auditRows(workspaceId, 'AI_CREDIT_LIMIT_ENABLED', 1);
        expect(enabled.metadata).toMatchObject({ instance_level: true });
      });
    });

    describe('when a builder with a custom limit is archived', () => {
      it('should keep the limit while they remain in another workspace and remove it once archived everywhere', async () => {
        const superAdmin = await createUser(app, {
          email: 'super@tooljet.io',
          userType: 'instance',
          groups: ['admin'],
        });
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
    });

    describe('when a workspace admin who is not a super admin saves', () => {
      it('should return 403', async () => {
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

    describe('when either limit endpoint is called', () => {
      it('should return 404', async () => {
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
});
