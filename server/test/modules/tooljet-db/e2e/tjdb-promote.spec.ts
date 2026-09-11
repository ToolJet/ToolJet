/**
 * Per-table promote e2e: applies exactly the migrations the next environment is missing, in order,
 * proven by introspecting the promoted physical table against the source's. A second promote must
 * be a no-op — that is the regression test for "replay records one application per migration".
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';
import {
  createUser,
  initTestApp,
  login,
  logout,
  buildTestSession,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
  withRealTransactions,
  setUpTjdbWorkspace,
  cleanupTjdbWorkspace,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { User } from '@entities/user.entity';
import { buildTableSchemaSnapshot } from '@modules/tooljet-db/helpers/table-schema-snapshot';
import { AbilityService } from '@modules/ability/interfaces/IService';
// EE tokens: getProviders() registers the edition-resolved class as the DI token.
import { TooljetDbController } from '@ee/tooljet-db/controller';

describe('TooljetDb promote', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let devEnvId: string;
    let stagingEnvId: string;
    let productionEnvId: string;
    let promoteService: any;
    let adminOrg: any;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    async function createTable(cookie: string[], tableName: string, columns: any[]) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(cookie))
        .send({ table_name: tableName, columns, foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function promote(cookie: string[], tableId: string, environmentId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/promote`)
        .set(headers(cookie))
        .send({ environment_id: environmentId });
    }

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
    };

    async function internalTableId(tableName: string): Promise<string> {
      const row = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName },
      });
      return row.id;
    }

    async function relationFor(tableId: string, environmentId: string): Promise<InternalTableRelation | null> {
      return getDefaultDataSource().manager.findOne(InternalTableRelation, {
        where: { internalTableId: tableId, environmentId },
      });
    }

    async function confirmedApplicationCount(relationId: string): Promise<number> {
      return getDefaultDataSource().manager.count(InternalTableMigrationApplication, {
        where: { relationId, appliedAt: Not(IsNull()) },
      });
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
      // The controller and app.get() can resolve different provider instances (TooljetDbModule is
      // cached twice — with and without the controller). Spy on the instance the route actually uses.
      promoteService = (app.get(TooljetDbController) as any).promoteService;

      const { user, organization } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      adminOrg = organization;
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      devEnvId = environments.find((e) => e.priority === 1).id;
      stagingEnvId = environments.find((e) => e.priority === 2).id;
      productionEnvId = environments.find((e) => e.priority === 3).id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);

          // `createUser` bypasses SetupOrganizationsUtilService.create() (the real onboarding path
          // that calls createTooljetDbTenantSchemaAndRole), so Task B0's ownership transfer needs
          // the tenant role provisioned here instead.
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    describe('POST /api/tooljet-db/organizations/:organizationId/table/:tableId/promote | applies the missing set', () => {
      it('should promote development → staging, reproduce the physical shape, and be a no-op on a second promote', async () => {
        expect(tjdbAvailable).toBe(true);

        await createTable(adminCookie, 'promote_me', [idColumn]);
        const tableId = await internalTableId('promote_me');

        // Two column changes → three migrations total (create_table + add_column + edit_column).
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/promote_me/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'title',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${orgId}/table/promote_me/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'title',
              data_type: 'character varying',
              constraints_type: { is_not_null: true, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect(res.statusCode).toBe(200));

        const devRelation = await relationFor(tableId, devEnvId);
        expect(devRelation).toBeTruthy();
        expect(await confirmedApplicationCount(devRelation.id)).toBe(3);

        const promoteRes = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(promoteRes.statusCode);
        expect(promoteRes.body.result).toMatchObject({ promoted_to: 'staging', applied_migrations: 3 });

        const stagingRelation = await relationFor(tableId, stagingEnvId);
        expect(stagingRelation).toBeTruthy();
        expect(await confirmedApplicationCount(stagingRelation.id)).toBe(3);

        const tjdb = getTooljetDbDataSource();
        const reloadedStaging = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
          where: { id: stagingRelation.id },
        });
        const sourceSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          devRelation.id,
          devRelation.configurations.columns.column_names
        );
        const targetSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          reloadedStaging.id,
          reloadedStaging.configurations.columns.column_names
        );
        const stripNames = (s: any) => ({
          ...s,
          unique_constraints: s.unique_constraints.map(({ name, ...r }) => r),
          indexes: s.indexes.map(({ name, ...r }) => r),
          foreign_keys: s.foreign_keys.map(({ name, referenced_table, ...r }) => r),
        });
        expect(stripNames(targetSnapshot)).toEqual(stripNames(sourceSnapshot));
        // Same column uuids, not merely the same count.
        expect(reloadedStaging.configurations.columns.column_names).toEqual(
          devRelation.configurations.columns.column_names
        );

        // Second promote: nothing missing → no new applications, no DDL.
        const second = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(second.statusCode);
        expect(second.body.result).toMatchObject({ applied_migrations: 0 });
        expect(await confirmedApplicationCount(reloadedStaging.id)).toBe(3);
        const pending = await getDefaultDataSource().manager.count(InternalTableMigrationApplication, {
          where: { relationId: reloadedStaging.id, appliedAt: IsNull() },
        });
        expect(pending).toBe(0);
      });

      it('should resolve pending applications left by a crashed prior promote before computing what is missing, and confirm them rather than delete them', async () => {
        expect(tjdbAvailable).toBe(true);

        await createTable(adminCookie, 'crash_recovery_tbl', [idColumn]);
        const tableId = await internalTableId('crash_recovery_tbl');
        const first = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(first.statusCode);
        const stagingRelation = await relationFor(tableId, stagingEnvId);
        expect(await confirmedApplicationCount(stagingRelation.id)).toBe(1);

        // Simulate the crash window: DDL committed (staging's physical table already matches the
        // create_table migration), but the tick to "confirmed" never happened. Back-date the
        // migration's created_at past ADJUDICATION_GRACE_WINDOW so adjudicatePending is willing to
        // touch it instead of deferring to a still-in-flight request.
        const applications = await getDefaultDataSource().manager.find(InternalTableMigrationApplication, {
          where: { relationId: stagingRelation.id },
        });
        const migrationIds = applications.map((a) => a.migrationId);
        await getDefaultDataSource().manager.update(
          InternalTableMigration,
          { id: migrationIds[0] },
          { createdAt: new Date(Date.now() - 10_000) }
        );
        await getDefaultDataSource().manager.update(
          InternalTableMigrationApplication,
          { relationId: stagingRelation.id },
          { appliedAt: null }
        );

        const second = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(second.statusCode);
        expect(second.body.result).toMatchObject({ applied_migrations: 0 });
        // Confirmed, not deleted — adjudicatePending ran before computeMissingMigrations, so the
        // rows it correctly re-confirmed were never seen as "missing" and replayed/discarded.
        expect(await confirmedApplicationCount(stagingRelation.id)).toBe(1);
      });

      it('should 409 the loser when two promotes race the same table and target environment', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'lock_race_tbl', [idColumn]);
        const tableId = await internalTableId('lock_race_tbl');

        // The suite's test-isolation proxy routes every DataSource.createQueryRunner() call — ours
        // and promote's own — onto the same one physical session for the whole spec file, so a lock
        // taken through it is always reentrant with promote's and never blocks it. A raw `pg` client
        // opened directly against the same database is a genuinely separate session the proxy can't
        // see, which is what promote's own advisory lock actually needs to lose against.
        const options = getDefaultDataSource().options as any;
        const lockClient = new Client({
          host: options.host,
          port: options.port,
          user: options.username,
          password: options.password,
          database: options.database,
        });
        await lockClient.connect();
        const lockKey = `${tableId}:${stagingEnvId}`;
        try {
          const {
            rows: [{ locked }],
          } = await lockClient.query('SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked', [lockKey]);
          expect(locked).toBe(true);

          const res = await promote(adminCookie, tableId, devEnvId);
          expect(res.statusCode).toBe(409);
        } finally {
          await lockClient.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [lockKey]);
          await lockClient.end();
        }

        // Lock released — the same promote now succeeds cleanly.
        const res = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(res.statusCode);
      });
    });

    describe('POST .../promote | failure matrix', () => {
      it('should 403 when the caller lacks tjdb_crud', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'no_crud_tbl', [idColumn]);
        const tableId = await internalTableId('no_crud_tbl');

        const { user: endUser } = await createUser(app, {
          email: 'enduser@tooljet.io',
          groups: ['end-user'],
          organization: adminOrg,
        });
        const { tokenCookie } = await buildTestSession(endUser as unknown as User, orgId);

        const res = await promote(tokenCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(403);
      });

      it('should 403 when environmentAccess denies the target environment', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'env_denied_tbl', [idColumn]);
        const tableId = await internalTableId('env_denied_tbl');

        const ability = app.get(AbilityService);
        jest.spyOn(ability, 'resourceActionsPermission').mockResolvedValue({
          APP: { environmentAccess: { development: true, staging: false, production: false, released: false } },
        } as any);

        const res = await promote(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(403);
      });

      it('should 403 when the target environment name is not a known access key', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'renamed_env_tbl', [idColumn]);
        const tableId = await internalTableId('renamed_env_tbl');

        await getDefaultDataSource().manager.update(AppEnvironment, { id: stagingEnvId }, { name: 'qa' });
        const res = await promote(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(403);
      });

      it('should 400 when the active branch is not the default', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'branch_tbl', [idColumn]);
        const tableId = await internalTableId('branch_tbl');

        jest.spyOn(promoteService.relationResolverService, 'resolveBranchIdFor').mockResolvedValue(uuidv4());
        const res = await promote(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(400);
      });

      it('should 400 with the recorded reason when the source relation carries baseline_error', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'baseline_err_tbl', [idColumn]);
        const tableId = await internalTableId('baseline_err_tbl');
        const devRelation = await relationFor(tableId, devEnvId);
        await getDefaultDataSource().manager.update(
          InternalTableRelation,
          { id: devRelation.id },
          { baselineError: 'could not synthesize a portable baseline' }
        );

        const res = await promote(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(400);
        expect(JSON.stringify(res.body)).toContain('could not synthesize a portable baseline');
      });

      it('should 400 when there is no higher environment to promote to', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'top_env_tbl', [idColumn]);
        const tableId = await internalTableId('top_env_tbl');
        // Give it a production relation, then promote from production.
        await getDefaultDataSource().manager.save(
          getDefaultDataSource().manager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: tableId,
            environmentId: productionEnvId,
            branchId: (await relationFor(tableId, devEnvId)).branchId,
            configurations: null,
          })
        );

        const res = await promote(adminCookie, tableId, productionEnvId);
        expect(res.statusCode).toBe(400);
      });

      it('should 400 and leave nothing behind when a foreign key cannot replay in this order', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'fk_parent', [idColumn]);
        await createTable(adminCookie, 'fk_child', [
          idColumn,
          {
            column_name: 'parent_id',
            data_type: 'integer',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
        ]);
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/fk_child/foreignkey`)
          .set(headers(adminCookie))
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'fk_parent',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        const childId = await internalTableId('fk_child');
        // Promote the child before the parent — the FK's referenced sibling does not exist in staging.
        const res = await promote(adminCookie, childId, devEnvId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/has no relation in this environment/);

        // Nothing left behind: no staging relation, no applications.
        const stagingChild = await relationFor(childId, stagingEnvId);
        expect(stagingChild).toBeNull();
      });

      it('should 400 with the raw Postgres message and the failing statement when the cause is a real QueryFailedError', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'qfe_tbl', [idColumn]);
        const tableId = await internalTableId('qfe_tbl');

        // First promote: staging gets the create_table application, confirmed.
        const first = await promote(adminCookie, tableId, devEnvId);
        expect([200, 201]).toContain(first.statusCode);
        const stagingRelation = await relationFor(tableId, stagingEnvId);

        // A second, not-yet-promoted migration on dev: add_column. Physical columns are named by
        // display name (column_names maps display name → uuid for logical identity bookkeeping, not
        // the physical Postgres column) — pre-creating the same-named physical column on staging
        // makes the replay's ALTER TABLE ADD COLUMN collide for real.
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/qfe_tbl/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'extra',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        await getTooljetDbDataSource().query(
          `ALTER TABLE "${tenantSchema}"."${stagingRelation.id}" ADD COLUMN "extra" character varying`
        );

        const res = await promote(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
        expect(res.body.statement).toEqual(expect.stringContaining('extra'));
      });
    });

    describe('GET .../promote/preview | lists the missing set', () => {
      async function preview(cookie: string[], tableId: string, environmentId: string) {
        return request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/promote/preview`)
          .query({ environment_id: environmentId })
          .set(headers(cookie));
      }

      it('should name the target environment, list the missing migrations in order, and mutate nothing', async () => {
        expect(tjdbAvailable).toBe(true);

        await createTable(adminCookie, 'preview_me', [idColumn]);
        const tableId = await internalTableId('preview_me');

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/preview_me/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'title',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        const res = await preview(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(200);
        expect(res.body.result.target_environment).toMatchObject({ id: stagingEnvId, name: 'staging' });
        expect(res.body.result.target_relation_exists).toBe(false);
        expect(res.body.result.missing_migrations).toHaveLength(2);
        expect(res.body.result.missing_migrations.map((m) => m.action)).toEqual(['create_table', 'add_column']);
        expect(res.body.result.missing_migrations[1].sql).toBe(
          'ALTER TABLE preview_me\n  ADD COLUMN title character varying;'
        );

        // Preview mutates nothing: no target relation, no DDL, source's applied set unchanged.
        expect(await relationFor(tableId, stagingEnvId)).toBeNull();
        expect(await confirmedApplicationCount((await relationFor(tableId, devEnvId)).id)).toBe(2);
      });

      it('should list only what the target is missing when the target relation already exists', async () => {
        expect(tjdbAvailable).toBe(true);

        await createTable(adminCookie, 'preview_partial', [idColumn]);
        const tableId = await internalTableId('preview_partial');
        await promote(adminCookie, tableId, devEnvId);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/preview_partial/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'extra',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        const res = await preview(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(200);
        expect(res.body.result.target_relation_exists).toBe(true);
        expect(res.body.result.missing_migrations).toHaveLength(1);
        expect(res.body.result.missing_migrations[0].action).toBe('add_column');
      });

      it('should 403 when environmentAccess denies the target environment, same as promote', async () => {
        expect(tjdbAvailable).toBe(true);
        await createTable(adminCookie, 'preview_env_denied_tbl', [idColumn]);
        const tableId = await internalTableId('preview_env_denied_tbl');

        const ability = app.get(AbilityService);
        jest.spyOn(ability, 'resourceActionsPermission').mockResolvedValue({
          APP: { environmentAccess: { development: true, staging: false, production: false, released: false } },
        } as any);

        const res = await preview(adminCookie, tableId, devEnvId);
        expect(res.statusCode).toBe(403);
      });
    });
  });

  describe('CE', () => {
    let app: INestApplication;
    let cookie: string[];
    let orgId: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      const { user } = await createUser(app, {
        email: 'ce-admin@tooljet.io',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      await ensureAppEnvironments(app, orgId);
      ({ tokenCookie: cookie } = await login(app, 'ce-admin@tooljet.io'));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should 403 — promote requires an Enterprise licence', async () => {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/${uuidv4()}/promote`)
        .set({ Cookie: cookie, 'tj-workspace-id': orgId })
        .send({ environment_id: uuidv4() });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Enterprise licence/);
    });

    it('should 403 — promote preview requires an Enterprise licence', async () => {
      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${uuidv4()}/promote/preview`)
        .query({ environment_id: uuidv4() })
        .set({ Cookie: cookie, 'tj-workspace-id': orgId });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Enterprise licence/);
    });
  });

  // Moved from raw-sql-migrations.e2e-spec.ts (deleted as a near-total duplicate of this file plus
  // tjdb-raw-sql-migration.spec.ts / tjdb-revert-migration.spec.ts / tjdb-column-type-change.spec.ts
  // / tooljetdb-operations.spec.ts) - these two were the only cases it covered that nothing else did.
  //
  // Its own `app`/`beforeAll`/`afterAll`, not nested under 'EE (plan: enterprise)' above: both tests
  // build their workspace inside `withRealTransactions`, which rolls back and restarts this file's
  // shared suite transaction - reusing the EE block's app would roll back its `adminOrgId` fixtures
  // too, and its blanket per-test `afterEach` (logout of that shared session) would then 403 right
  // after either test here ran.
  describe('EE (plan: enterprise) | raw SQL steps interleaved with promote', () => {
    let app: INestApplication;
    let tjdbAvailable: boolean;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    const headers = (organizationId: string, cookie: string[]) => ({
      Cookie: cookie,
      'tj-workspace-id': organizationId,
    });

    async function createRawSqlTable(organizationId: string, cookie: string[], tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set(headers(organizationId, cookie))
        .send({
          table_name: tableName,
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
            },
            {
              column_name: 'gpa',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          ],
          foreign_keys: [],
        });
      expect([200, 201]).toContain(res.statusCode);
    }

    async function addColumn(organizationId: string, cookie: string[], tableName: string, columnName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableName}/column`)
        .set(headers(organizationId, cookie))
        .send({
          column: {
            column_name: columnName,
            data_type: 'character varying',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
        });
      expect([200, 201]).toContain(res.statusCode);
    }

    async function editColumn(
      organizationId: string,
      cookie: string[],
      tableName: string,
      columnName: string,
      constraints_type: Record<string, boolean>
    ) {
      const res = await request
        .agent(app.getHttpServer())
        .patch(`/api/tooljet-db/organizations/${organizationId}/table/${tableName}/column`)
        .set(headers(organizationId, cookie))
        .send({ column: { column_name: columnName, data_type: 'character varying', constraints_type } });
      expect(res.statusCode).toBe(200);
    }

    async function tableAndRelation(organizationId: string, tableName: string) {
      const manager = getDefaultDataSource().manager;
      const internalTable = await manager.findOneOrFail(InternalTable, { where: { organizationId, tableName } });
      const relation = await manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });
      return { internalTable, relation };
    }

    function runRawSql(
      organizationId: string,
      cookie: string[],
      tableId: string,
      body: { sql: string; refs?: Record<string, string> }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations/sql`)
        .set(headers(organizationId, cookie))
        .send({ refs: {}, ...body });
    }

    function promoteRawSqlWorkspace(organizationId: string, cookie: string[], tableId: string, environmentId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/promote`)
        .set(headers(organizationId, cookie))
        .send({ environment_id: environmentId });
    }

    // Regression for the modal's decision to interleave structured + raw SQL steps in one save:
    // replayRawSqlMigration opens its own tenant connection (raw SQL must never run as admin), so a
    // raw_sql migration replayed in the same applyMigrations batch as a structured migration that
    // precedes it cannot see that structured migration's uncommitted DDL - "column age does not
    // exist" - unless each migration commits before the next one replays.
    it('should promote a structured add_column followed by a raw SQL step against that new column in one batch', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'promote-raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie, environments } = workspace;
          const devEnvId = environments.find((e) => e.priority === 1).id;

          await createRawSqlTable(organizationId, cookie, 'interleave_tbl');
          await addColumn(organizationId, cookie, 'interleave_tbl', 'age');
          const { internalTable } = await tableAndRelation(organizationId, 'interleave_tbl');

          const sqlRes = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `UPDATE "{{self}}" SET age = '0'`,
          });
          expect([200, 201]).toContain(sqlRes.statusCode);

          // First promote for this table: create_table + add_column + the raw_sql step above are
          // all missing on staging, so promote replays all three in one applyMigrations batch -
          // exactly the structured-then-raw_sql interleaving the bug requires.
          const promoteRes = await promoteRawSqlWorkspace(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(promoteRes.statusCode);
          expect(promoteRes.body.result).toMatchObject({ applied_migrations: 3 });
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    // Regression for per-migration commit: a chain of 5 where m4 fails on the TARGET's data (a
    // pre-existing row it can't satisfy a new NOT NULL against) must leave m1-m3 confirmed, m4/m5
    // untouched, and a second promote after fixing the data must apply exactly m4-m5 - never
    // re-replay m1-m3, never skip m4.
    it('should resume from the failed migration on target data conflict, confirming nothing out of order', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'promote-raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie, tenantSchema, environments } = workspace;
          const devEnvId = environments.find((e) => e.priority === 1).id;
          const stagingEnvId = environments.find((e) => e.priority === 2).id;

          // m1 (create_table, with 'gpa'). m2, m3: padding, unrelated to the eventual failure.
          await createRawSqlTable(organizationId, cookie, 'resume_tbl');
          await addColumn(organizationId, cookie, 'resume_tbl', 'note');
          await editColumn(organizationId, cookie, 'resume_tbl', 'gpa', {
            is_not_null: false,
            is_primary_key: false,
            is_unique: true,
          });

          const { internalTable } = await tableAndRelation(organizationId, 'resume_tbl');
          const manager = getDefaultDataSource().manager;
          const devMigrationsBefore = await manager.find(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
            order: { sequence: 'ASC' },
          });
          expect(devMigrationsBefore).toHaveLength(3);
          const [m1, m2, m3] = devMigrationsBefore;

          // m1-m3 promote cleanly - staging's physical table now exists with 'note' still nullable.
          const firstPromote = await promoteRawSqlWorkspace(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(firstPromote.statusCode);
          const stagingRelation = await manager.findOneOrFail(InternalTableRelation, {
            where: { internalTableId: internalTable.id, environmentId: stagingEnvId },
          });
          expect(
            await manager.count(InternalTableMigrationApplication, {
              where: { relationId: stagingRelation.id, appliedAt: Not(IsNull()) },
            })
          ).toBe(3);

          // Data conflict on the TARGET only - dev's own 'note' column never gets a NULL row, so m5
          // authors fine against dev.
          await getTooljetDbDataSource().query(
            `INSERT INTO "${tenantSchema}"."${stagingRelation.id}" (id) VALUES (999)`
          );

          // m4, m5, m6 are all missing on staging and land in ONE promote batch (the second one
          // below) - m4 must succeed and replay-commit *before* m5 replays, m5 fails on staging's
          // data, m6 is never reached. Per-migration commit is what makes m4 survive m5's failure:
          // the old shared-transaction-per-batch code rolled m4's DDL back too.
          await addColumn(organizationId, cookie, 'resume_tbl', 'extra');
          await editColumn(organizationId, cookie, 'resume_tbl', 'note', {
            is_not_null: true,
            is_primary_key: false,
            is_unique: false,
          });
          await addColumn(organizationId, cookie, 'resume_tbl', 'final');

          const devMigrations = await manager.find(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
            order: { sequence: 'ASC' },
          });
          expect(devMigrations).toHaveLength(6);
          const [, , , m4, m5, m6] = devMigrations;

          const secondPromote = await promoteRawSqlWorkspace(organizationId, cookie, internalTable.id, devEnvId);
          expect(secondPromote.statusCode).toBe(400);
          expect(JSON.stringify(secondPromote.body)).toMatch(/null/i);

          // m1-m4 stayed confirmed (m4 committed before m5 even started replaying); m5/m6 got no
          // row at all - recordApplications' pending rows for them were discarded, not left
          // dangling or wrongly confirmed.
          const applicationsAfterFailure = await manager.find(InternalTableMigrationApplication, {
            where: { relationId: stagingRelation.id },
          });
          const confirmedIds = applicationsAfterFailure.filter((a) => a.appliedAt).map((a) => a.migrationId);
          expect(confirmedIds.sort()).toEqual([m1.id, m2.id, m3.id, m4.id].sort());
          const allIds = applicationsAfterFailure.map((a) => a.migrationId);
          expect(allIds).not.toContain(m5.id);
          expect(allIds).not.toContain(m6.id);

          // Fix the data, then resume: only m5-m6 are missing (m4 is already confirmed), so only
          // they apply.
          await getTooljetDbDataSource().query(`DELETE FROM "${tenantSchema}"."${stagingRelation.id}" WHERE id = 999`);
          const thirdPromote = await promoteRawSqlWorkspace(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(thirdPromote.statusCode);
          expect(thirdPromote.body.result).toMatchObject({ applied_migrations: 2 });

          const finalConfirmedIds = (
            await manager.find(InternalTableMigrationApplication, {
              where: { relationId: stagingRelation.id, appliedAt: Not(IsNull()) },
            })
          )
            .map((a) => a.migrationId)
            .sort();
          expect(finalConfirmedIds).toEqual([m1.id, m2.id, m3.id, m4.id, m5.id, m6.id].sort());
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });
  });
});
