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
} from 'test-helper';
import { v4 as uuidv4 } from 'uuid';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';

describe('TooljetDb baseline repair', () => {
  // No licence split — repair is ungated (Task 7, step 3). Tested against CE directly: the
  // interesting claim is that this works with no Enterprise licence at all.
  describe('CE', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let productionEnvId: string;

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

      await createTable(adminCookie, 'repairable_tbl', [idColumn]);
      const tableId = await internalTableId('repairable_tbl');
      const relation = await relationFor(tableId);

      // Simulate the rollout's failure: a relation whose physical table is fine but was recorded
      // with a baseline_error at some earlier point (e.g. a transient failure since fixed).
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: relation.id },
        { baselineError: 'transient failure, already resolved' }
      );

      const res = await repair(adminCookie, tableId);
      expect([200, 201]).toContain(res.statusCode);

      const reloaded = await relationFor(tableId);
      expect(reloaded.baselineError).toBeNull();

      // create_table already recorded+confirmed its own 'structured' migration against this
      // relation — repair adds 'baseline' rows alongside it, never replacing them.
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

      await createTable(adminCookie, 'unrepairable_tbl', [idColumn]);
      const tableId = await internalTableId('unrepairable_tbl');
      const relation = await relationFor(tableId);

      await getTooljetDbDataSource().query(`DROP TABLE "${tenantSchema}"."${relation.id}"`);
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: relation.id },
        { baselineError: 'stale reason from a previous attempt' }
      );

      const res = await repair(adminCookie, tableId);
      expect(res.statusCode).toBe(400);

      const reloaded = await relationFor(tableId);
      expect(reloaded.baselineError).not.toBeNull();
      expect(reloaded.baselineError).not.toEqual('stale reason from a previous attempt');
      expect(reloaded.baselineError).toMatch(/does not exist/);
    });

    it('should be a no-op on a second repair — no duplicate baseline migrations', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable(adminCookie, 'repair_twice_tbl', [idColumn]);
      const tableId = await internalTableId('repair_twice_tbl');
      const relation = await relationFor(tableId);
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: relation.id },
        { baselineError: 'transient failure' }
      );

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

      await createTable(adminCookie, 'twin_repair_tbl', [idColumn]);
      const tableId = await internalTableId('twin_repair_tbl');
      const devRelation = await relationFor(tableId);

      // Simulate migration B's shape for this table: the real data lives at production (LIKE-cloned
      // from dev here, since this is a live-created table, not a rollout one — the point under test
      // is relation *selection*, not the clone mechanics migration B itself already covers), and the
      // empty twin at development carries the same baseline_error copied verbatim.
      const productionRelationId = uuidv4();
      await getTooljetDbDataSource().query(
        `CREATE TABLE "${tenantSchema}"."${productionRelationId}" (LIKE "${tenantSchema}"."${devRelation.id}" INCLUDING ALL)`
      );
      await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(InternalTableRelation, {
          id: productionRelationId,
          internalTableId: tableId,
          environmentId: productionEnvId,
          branchId: devRelation.branchId,
          configurations: devRelation.configurations,
          baselineError: 'copied verbatim from the twin',
        })
      );
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: devRelation.id },
        { baselineError: 'copied verbatim from the twin' }
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
  });
});
