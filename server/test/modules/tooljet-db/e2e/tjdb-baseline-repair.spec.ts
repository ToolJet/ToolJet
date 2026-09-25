/**
 * Baseline repair e2e: re-attempts `synthesizeBaseline` against a relation carrying `baseline_error`
 * and reports the outcome — never classifies repairability up front. No licence gate: real logic in
 * CE, since an unlicensed workspace buying a licence later needs this to get anything promotable.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { In, IsNull, Not } from 'typeorm';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
  recoverAbortedSuiteTx,
} from 'test-helper';
import { v4 as uuidv4 } from 'uuid';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

describe('TooljetDb baseline repair', () => {
  // No licence split — repair is deliberately ungated. Tested against CE directly: the
  // interesting claim is that this works with no Enterprise licence at all.
  describe('CE', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let productionEnvId: string;
    let developmentEnvId: string;
    let defaultBranchId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    async function createTable(cookie: string[], tableName: string, columns: any[]) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(cookie))
        .send({ table_name: tableName, columns, foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function repair(cookie: string[], tableId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/baseline/repair`)
        .set(headers(cookie));
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

    async function relationFor(tableId: string): Promise<InternalTableRelation> {
      return getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: tableId },
      });
    }

    async function relationsFor(tableId: string): Promise<InternalTableRelation[]> {
      return getDefaultDataSource().manager.find(InternalTableRelation, { where: { internalTableId: tableId } });
    }

    /** Reproduces Migration A's failure output for one table's first relation: a physical tenant
     *  table, an `internal_tables` row, and a relation (`id === internal_table_id` — migration A's
     *  convention for a table's first/only relation) at `environmentId` carrying `baselineError`
     *  (or clean, if null) — but, unlike a table created through `createTable()`, zero recorded
     *  `internal_table_migrations` rows. Mirrors `TjdbRolloutMigrationASubstrate`'s
     *  `repairAndBaselineOneTable` on its failure branch: `migrations` stays `[]`, the relation is
     *  still written with the error. This is the shape the existingMigrations guard needs to see to
     *  allow repair at all. */
    async function seedUnbaselinedTable(
      tableName: string,
      baselineError: string | null,
      environmentId: string = developmentEnvId
    ): Promise<{ tableId: string; configurations: any }> {
      const appDs = getDefaultDataSource();
      const tableId = uuidv4();

      await appDs.query(
        `INSERT INTO internal_tables (id, organization_id, table_name, co_relation_id) VALUES ($1, $2, $3, $4)`,
        [tableId, orgId, tableName, uuidv4()]
      );
      await getTooljetDbDataSource().query(
        `CREATE TABLE "${tenantSchema}"."${tableId}" ("id" SERIAL PRIMARY KEY, "name" character varying)`
      );

      const configurations = { columns: { column_names: { id: uuidv4(), name: uuidv4() }, configurations: {} } };
      await appDs.query(
        `INSERT INTO internal_table_relations
           (id, internal_table_id, environment_id, branch_id, configurations, baseline_error, created_at)
         VALUES ($1, $1, $2, $3, $4, $5, now())`,
        [tableId, environmentId, defaultBranchId, configurations, baselineError]
      );

      return { tableId, configurations };
    }

    /** Adds a second relation (e.g. a twin) for `tableId`, physically LIKE-cloned from
     *  `sourceRelationId`, carrying its own `baselineError`. Mirrors migration B's clone step
     *  without the promotion/migration-copy — tests only need the relation row to exist. */
    async function seedTwinRelation(
      tableId: string,
      sourceRelationId: string,
      configurations: any,
      environmentId: string,
      baselineError: string | null,
      branchId: string = defaultBranchId
    ): Promise<string> {
      const twinRelationId = uuidv4();
      await getTooljetDbDataSource().query(
        `CREATE TABLE "${tenantSchema}"."${twinRelationId}" (LIKE "${tenantSchema}"."${sourceRelationId}" INCLUDING ALL)`
      );
      await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(InternalTableRelation, {
          id: twinRelationId,
          internalTableId: tableId,
          environmentId,
          branchId,
          configurations,
          baselineError,
        })
      );
      return twinRelationId;
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'repair-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      productionEnvId = environments.reduce((highest, current) =>
        current.priority > highest.priority ? current : highest
      ).id;
      developmentEnvId = environments.reduce((lowest, current) =>
        current.priority < lowest.priority ? current : lowest
      ).id;
      defaultBranchId = (
        await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
          where: { organizationId: orgId, isDefault: true },
        })
      ).id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);

          // `createUser` bypasses SetupOrganizationsUtilService.create() (the real onboarding path
          // that calls createTooljetDbTenantSchemaAndRole), so the ownership transfer needs
          // the tenant role provisioned here instead.
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app, 'repair-admin@tooljet.io'));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should re-synthesize the baseline, clear baseline_error, and confirm the migrations against the relation, when the table is in fact baselineable', async () => {
      expect(tjdbAvailable).toBe(true);

      // Migration A's actual failure shape: baseline_error set, zero recorded migrations. Not
      // built via createTable() — that always records a 'structured' migration up front, which the
      // existingMigrations guard (repairBaseline fix #3) now correctly refuses to repair over.
      const { tableId } = await seedUnbaselinedTable('repairable_tbl', 'transient failure, already resolved');
      const relation = await relationFor(tableId);

      const res = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(res.statusCode);

      const reloaded = await relationFor(tableId);
      expect(reloaded.baselineError).toBeNull();

      const baselineMigrations = await getDefaultDataSource().manager.find(InternalTableMigration, {
        where: { internalTableId: tableId, kind: 'baseline' },
      });
      expect(baselineMigrations.length).toBeGreaterThan(0);

      const confirmedBaselineCount = await getDefaultDataSource().manager.count(InternalTableMigrationApplication, {
        where: {
          relationId: relation.id,
          migrationId: In(baselineMigrations.map((migration) => migration.id)),
          appliedAt: Not(IsNull()),
        },
      });
      expect(confirmedBaselineCount).toBe(baselineMigrations.length);
    });

    it('should 400 and update baseline_error to the fresh message, not clear it, when the physical relation genuinely does not exist', async () => {
      expect(tjdbAvailable).toBe(true);

      // Same zero-migrations shape as the repairable case — this table just also has its physical
      // relation gone, so synthesis itself (not the existingMigrations guard) is what fails.
      const { tableId } = await seedUnbaselinedTable('unrepairable_tbl', 'stale reason from a previous attempt');
      const relation = await relationFor(tableId);

      await getTooljetDbDataSource().query(`DROP TABLE "${tenantSchema}"."${relation.id}"`);

      const res = await repair(adminCookie, tableId);
      expect(res.statusCode).toBe(400);

      const reloaded = await relationFor(tableId);
      expect(reloaded.baselineError).not.toBeNull();
      expect(reloaded.baselineError).not.toEqual('stale reason from a previous attempt');
      expect(reloaded.baselineError).toMatch(/does not exist/);
    });

    it('should 400 and record baseline_error when a foreign key references a composite primary key', async () => {
      expect(tjdbAvailable).toBe(true);

      // TJDB's structured-migration format can only represent a single-column primary key, so a
      // foreign key referencing a composite one is a real, unbaselineable shape - one of the two
      // reasons baseline_error exists (the other, a missing physical relation, is covered above).
      // Real physical tables throughout: this needs a real Postgres introspection of a real
      // composite constraint to be meaningful, not a double faking pg_constraint's output.
      const parentId = uuidv4();
      await getTooljetDbDataSource().query(
        `CREATE TABLE "${tenantSchema}"."${parentId}" ` +
          `("tenant_id" integer NOT NULL, "id" integer NOT NULL, PRIMARY KEY ("tenant_id", "id"))`
      );

      const { tableId: childId } = await seedUnbaselinedTable('composite_fk_child_tbl', 'transient failure');
      await getTooljetDbDataSource().query(
        `ALTER TABLE "${tenantSchema}"."${childId}" ADD COLUMN "parent_tenant_id" integer, ADD COLUMN "parent_id" integer`
      );
      // Must reference the parent's PRIMARY KEY column set as a whole - Postgres rejects a foreign
      // key that only partially covers a composite unique/primary-key constraint.
      await getTooljetDbDataSource().query(
        `ALTER TABLE "${tenantSchema}"."${childId}" ADD CONSTRAINT "fk_composite_parent" ` +
          `FOREIGN KEY ("parent_tenant_id", "parent_id") REFERENCES "${tenantSchema}"."${parentId}" ("tenant_id", "id")`
      );

      const res = await repair(adminCookie, childId);
      expect(res.statusCode).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/references composite primary key/);

      const reloaded = await relationFor(childId);
      expect(reloaded.baselineError).toMatch(/references composite primary key/);
      const baselineMigrations = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: childId, kind: 'baseline' },
      });
      expect(baselineMigrations).toBe(0);
    });

    it('should be a no-op on a second repair — no duplicate baseline migrations', async () => {
      expect(tjdbAvailable).toBe(true);

      const { tableId } = await seedUnbaselinedTable('repair_twice_tbl', 'transient failure');

      const first = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(first.statusCode);
      const afterFirst = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: tableId, kind: 'baseline' },
      });

      // Second call: baseline_error is already null, so there's nothing to re-attempt.
      const second = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(second.statusCode);
      expect(second.body.result.migrations_recorded).toBe(0);

      const afterSecond = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: tableId, kind: 'baseline' },
      });
      expect(afterSecond).toBe(afterFirst);
    });

    it('should target the highest-priority relation and clear baseline_error on every relation for the table', async () => {
      expect(tjdbAvailable).toBe(true);

      // Migration A's shape for this table: development relation, baseline_error set, zero
      // migrations. Then migration B's shape: the twin at production (LIKE-cloned from dev, the
      // same clone mechanics migration B itself already covers) copies the same baseline_error
      // verbatim. The point under test is relation *selection* (repair targets production, the
      // data-bearing relation), not the clone mechanics.
      const { tableId, configurations } = await seedUnbaselinedTable(
        'twin_repair_tbl',
        'copied verbatim from the twin',
        developmentEnvId
      );
      const devRelation = await relationFor(tableId);

      const productionRelationId = await seedTwinRelation(
        tableId,
        devRelation.id,
        configurations,
        productionEnvId,
        'copied verbatim from the twin'
      );

      const res = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(res.statusCode);

      const reloadedRelations = await relationsFor(tableId);
      expect(reloadedRelations.every((r) => r.baselineError === null)).toBe(true);

      // Confirmed against the data-bearing (production) relation, not the empty dev twin.
      const baselineMigrations = await getDefaultDataSource().manager.find(InternalTableMigration, {
        where: { internalTableId: tableId, kind: 'baseline' },
      });
      const confirmedOnProduction = await getDefaultDataSource().manager.count(InternalTableMigrationApplication, {
        where: {
          relationId: productionRelationId,
          migrationId: In(baselineMigrations.map((m) => m.id)),
          appliedAt: Not(IsNull()),
        },
      });
      expect(confirmedOnProduction).toBe(baselineMigrations.length);
      const confirmedOnDev = await getDefaultDataSource().manager.count(InternalTableMigrationApplication, {
        where: {
          relationId: devRelation.id,
          migrationId: In(baselineMigrations.map((m) => m.id)),
        },
      });
      expect(confirmedOnDev).toBe(0);
    });

    it('should 400 and leave baseline_error and the migration chain untouched when the table already has recorded migrations', async () => {
      expect(tjdbAvailable).toBe(true);

      // Unlike the repairable-table tests above, this table goes through createTable() on purpose
      // — it needs a genuine recorded 'structured' migration, the exact precondition fix #3's guard
      // exists to catch: baselineError set on a table that's already picked up live schema edits
      // since the rollout, which repair must refuse rather than insert a stale baseline ahead of them.
      await createTable(adminCookie, 'already_migrated_tbl', [idColumn]);
      const tableId = await internalTableId('already_migrated_tbl');
      const relation = await relationFor(tableId);
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: relation.id },
        { baselineError: 'transient failure, already resolved' }
      );
      const migrationsBefore = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: tableId },
      });
      expect(migrationsBefore).toBeGreaterThan(0);

      const res = await repair(adminCookie, tableId);
      expect(res.statusCode).toBe(400);

      const reloaded = await relationFor(tableId);
      expect(reloaded.baselineError).toBe('transient failure, already resolved');

      const migrationsAfter = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: tableId },
      });
      expect(migrationsAfter).toBe(migrationsBefore);
      const baselineMigrationsAfter = await getDefaultDataSource().manager.count(InternalTableMigration, {
        where: { internalTableId: tableId, kind: 'baseline' },
      });
      expect(baselineMigrationsAfter).toBe(0);
    });

    it('should not short-circuit on a clean data relation when a lower-priority twin still needs repair', async () => {
      expect(tjdbAvailable).toBe(true);

      // Production (the data relation repair targets) is already clean; only the development twin
      // still carries baseline_error. The old guard checked only the data relation and would have
      // returned migrations_recorded: 0 here without ever looking at the twin.
      const { tableId, configurations } = await seedUnbaselinedTable('every_relation_tbl', null, productionEnvId);
      const productionRelation = await relationFor(tableId);
      const devRelationId = await seedTwinRelation(
        tableId,
        productionRelation.id,
        configurations,
        developmentEnvId,
        'twin never got baselined'
      );

      const res = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.result.migrations_recorded).toBeGreaterThan(0);

      const reloadedRelations = await relationsFor(tableId);
      expect(reloadedRelations.every((r) => r.baselineError === null)).toBe(true);
      expect(reloadedRelations.find((r) => r.id === devRelationId)?.baselineError).toBeNull();
    });

    it('should not clear baseline_error on a relation belonging to a different branch', async () => {
      expect(tjdbAvailable).toBe(true);

      // repairBaseline reads relations scoped to the default branch only (branching isn't shipped
      // for TJDB — this simulates a stale relation left behind under a non-default branch, e.g.
      // after a default-branch switch) — the write clearing baseline_error must be scoped the same
      // way, or a repair on the default branch silently clears an error it never looked at.
      const otherBranch = await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(WorkspaceBranch, {
          organizationId: orgId,
          name: `other-branch-${uuidv4()}`,
          isDefault: false,
        })
      );

      const { tableId, configurations } = await seedUnbaselinedTable('branch_scoped_tbl', 'transient failure');
      const defaultRelation = await relationFor(tableId);
      const foreignBranchRelationId = await seedTwinRelation(
        tableId,
        defaultRelation.id,
        configurations,
        productionEnvId,
        'belongs to a different branch, never introspected',
        otherBranch.id
      );

      const res = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(res.statusCode);

      const reloadedDefault = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { id: defaultRelation.id },
      });
      expect(reloadedDefault.baselineError).toBeNull();

      const reloadedForeignBranch = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { id: foreignBranchRelationId },
      });
      expect(reloadedForeignBranch.baselineError).toBe('belongs to a different branch, never introspected');
    });

    it('should write the fresh failure message to every relation for the table, not leave a twin showing a stale one', async () => {
      expect(tjdbAvailable).toBe(true);

      const { tableId, configurations } = await seedUnbaselinedTable(
        'stale_twin_message_tbl',
        'stale message from a previous attempt',
        developmentEnvId
      );
      const devRelation = await relationFor(tableId);
      const productionRelationId = await seedTwinRelation(
        tableId,
        devRelation.id,
        configurations,
        productionEnvId,
        'stale message from a previous attempt'
      );

      // Force synthesis to fail for this repair attempt, same technique as the "physical relation
      // genuinely does not exist" test above - drop the relation repairBaseline actually targets
      // (the highest-priority one, production here), not dev's. Dropping dev's instead would also
      // fail for an unrelated reason: production's physical table was LIKE-cloned from dev's, and
      // `LIKE ... INCLUDING DEFAULTS` copies a SERIAL column's default expression verbatim rather
      // than minting a new sequence, so production's "id" default still points at dev's sequence -
      // dropping dev's table while that dependency exists is its own, different failure.
      await getTooljetDbDataSource().query(`DROP TABLE "${tenantSchema}"."${productionRelationId}"`);

      const res = await repair(adminCookie, tableId);
      expect(res.statusCode).toBe(400);

      const reloadedDev = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { id: devRelation.id },
      });
      const reloadedProduction = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { id: productionRelationId },
      });
      expect(reloadedDev.baselineError).toMatch(/does not exist/);
      expect(reloadedProduction.baselineError).toBe(reloadedDev.baselineError);
    });

    // A genuine two-connection race needs withRealTransactions (real, separate DB connections)
    // rather than this suite's default no-op transaction proxy, which pins every "transaction" a
    // test makes to the same shared connection and would just serialize two concurrent repair()
    // calls instead of racing them. Doing that safely here would mean tearing down this describe
    // block's shared org/tenant-schema mid-file (withRealTransactions rolls back the whole suite
    // transaction those live in) and rebuilding a throwaway workspace per test, the way
    // tjdb-rollout-migration-a.spec.ts's newWorkspace/cleanupWorkspace pair does — a bigger
    // structural change than this regression is worth. Asserting directly on the invariant the
    // concurrency fix actually relies on instead: two baseline migrations can never land at
    // sequence 1 for the same table, which is what turns a lost race into repairBaseline's
    // idempotent 23505 catch instead of a duplicate row.
    it('should reject a second baseline migration at sequence 1 for the same table — the constraint the concurrency fix relies on', async () => {
      expect(tjdbAvailable).toBe(true);

      const { tableId } = await seedUnbaselinedTable('unique_index_tbl', 'transient failure');
      const relation = await relationFor(tableId);

      await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(InternalTableMigration, {
          internalTableId: tableId,
          sequence: '1',
          branchId: relation.branchId,
          kind: 'baseline',
          payload: {},
        })
      );

      await expect(
        getDefaultDataSource().manager.save(
          getDefaultDataSource().manager.create(InternalTableMigration, {
            internalTableId: tableId,
            sequence: '1',
            branchId: relation.branchId,
            kind: 'baseline',
            payload: {},
          })
        )
      ).rejects.toMatchObject({ driverError: expect.objectContaining({ code: '23505' }) });

      // The rejected insert leaves the shared suite transaction aborted until rolled back to the
      // current test's SAVEPOINT — without this, afterEach's logout() runs against a poisoned
      // connection (global rollbackTestTransaction() runs after this spec's own afterEach, not before).
      await recoverAbortedSuiteTx();
    });
  });
});
