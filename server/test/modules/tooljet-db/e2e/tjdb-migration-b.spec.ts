/**
 * Rollout migration B: assigns a licensed workspace's pre-existing TJDB data to production and
 * gives it an empty development twin to author in. Unlicensed workspaces are left as migration A
 * placed them. Idempotent on the `id === internal_table_id` predicate - a re-run never promotes an
 * empty relation to production and never corrupts the twin's confirmed applied set.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { execFileSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  getDefaultDataSource,
  getTooljetDbDataSource,
  ensureAppEnvironments,
  withRealTransactions,
} from 'test-helper';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { synthesizeBaseline } from '@modules/tooljet-db/helpers/baseline-synthesis';
// EE tokens: getProviders() registers the edition-resolved class as the DI token.
import { TooljetDbEnvironmentAssignmentService } from '@ee/tooljet-db/services/tooljet-db-environment-assignment.service';
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';
import { TjdbRolloutMigrationBEnvironmentAssignment1788252587903 } from '../../../../data-migrations/1788252587903-TjdbRolloutMigrationBEnvironmentAssignment';

describe('TjdbRolloutMigrationB', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tooljetDbAvailable: boolean;
    let service: TooljetDbEnvironmentAssignmentService;
    let tableOperationsService: TooljetDbTableOperationsService;
    let licenseTermsService: LicenseTermsService;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();
      service = app.get(TooljetDbEnvironmentAssignmentService);
      tableOperationsService = app.get(TooljetDbTableOperationsService);
      licenseTermsService = app.get(LicenseTermsService);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    const appManager = () => getDefaultDataSource().manager;
    const tjdbManager = () => getTooljetDbDataSource().manager;

    async function priorityEnv(organizationId: string, priority: number): Promise<{ id: string }> {
      const [environment] = await appManager().query(
        `SELECT id FROM app_environments WHERE organization_id = $1 AND priority = $2`,
        [organizationId, priority]
      );
      return environment;
    }

    async function newWorkspace(email: string): Promise<string> {
      const { user } = await createUser(app, { email, groups: ['admin', 'end-user'] });
      const organizationId = user.defaultOrganizationId;
      await ensureAppEnvironments(app, organizationId);
      await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${organizationId}"`);

      // `createUser` bypasses SetupOrganizationsUtilService.create() (the real onboarding path
      // that calls createTooljetDbTenantSchemaAndRole), so Task B0's ownership transfer on the
      // LIKE-clone call site needs the tenant role provisioned here instead.
      const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
        `user_${organizationId}`,
      ]);
      if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${organizationId}"`);

      return organizationId;
    }

    /** Reproduces migration A's per-table output: physical table with a row, an `id === internal_table_id`
     *  relation at the priority-1 environment, confirmed baseline migration rows. Optionally a physical
     *  foreign key to `referencesTableId` (→ a sequence-2 baseline migration). */
    async function seedMigrationATable(
      organizationId: string,
      tableName: string,
      referencesTableId?: string
    ): Promise<{ tableId: string; schema: string }> {
      const appDs = getDefaultDataSource();
      const tjDs = getTooljetDbDataSource();
      const schema = `workspace_${organizationId}`;
      const tableId = uuidv4();

      await appDs.query(
        `INSERT INTO internal_tables (id, organization_id, table_name, co_relation_id) VALUES ($1, $2, $3, $4)`,
        [tableId, organizationId, tableName, uuidv4()]
      );
      const fkColumn = referencesTableId ? `, "parent_id" integer` : '';
      await tjDs.query(
        `CREATE TABLE "${schema}"."${tableId}" ("id" SERIAL PRIMARY KEY, "name" character varying${fkColumn})`
      );
      await tjDs.query(`INSERT INTO "${schema}"."${tableId}" ("name") VALUES ('seeded-production-row')`);
      if (referencesTableId) {
        await tjDs.query(
          `ALTER TABLE "${schema}"."${tableId}" ADD CONSTRAINT "fk_${tableId}" FOREIGN KEY ("parent_id") REFERENCES "${schema}"."${referencesTableId}" ("id")`
        );
      }

      const columnNames: Record<string, string> = { id: uuidv4(), name: uuidv4() };
      if (referencesTableId) columnNames.parent_id = uuidv4();
      const configurations = { columns: { column_names: columnNames, configurations: {} } };
      const developmentEnvironment = await priorityEnv(organizationId, 1);
      const branch = await appDs.manager.findOneOrFail(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
      });

      const appQueryRunner = appDs.createQueryRunner();
      const tjdbQueryRunner = tjDs.createQueryRunner();
      await appQueryRunner.connect();
      await tjdbQueryRunner.connect();
      let migrations;
      try {
        migrations = await synthesizeBaseline(appQueryRunner, tjdbQueryRunner, schema, tableId, configurations);
      } finally {
        await appQueryRunner.release();
        await tjdbQueryRunner.release();
      }

      await appDs.query(
        `INSERT INTO internal_table_relations
           (id, internal_table_id, environment_id, branch_id, configurations, baseline_error, created_at)
         VALUES ($1, $1, $2, $3, $4, NULL, now())`,
        [tableId, developmentEnvironment.id, branch.id, configurations]
      );
      for (const migration of migrations) {
        const [{ id: migrationId }] = await appDs.query(
          `INSERT INTO internal_table_migrations
             (internal_table_id, sequence, branch_id, kind, payload, resulting_schema, created_at)
           VALUES ($1, $2, $3, 'baseline', $4, $5, now()) RETURNING id`,
          [tableId, migration.sequence, branch.id, migration.payload, migration.resultingSchema]
        );
        await appDs.query(
          `INSERT INTO internal_table_migration_applications (migration_id, relation_id, applied_at)
           VALUES ($1, $2, now())`,
          [migrationId, tableId]
        );
      }

      return { tableId, schema };
    }

    async function relationRow(id: string) {
      const [row] = await appManager().query(`SELECT * FROM internal_table_relations WHERE id = $1`, [id]);
      return row;
    }

    async function twinIdFor(tableId: string): Promise<string | undefined> {
      const [row] = await appManager().query(
        `SELECT id FROM internal_table_relations WHERE internal_table_id = $1 AND id <> internal_table_id`,
        [tableId]
      );
      return row?.id;
    }

    async function physicalRowCount(schema: string, relationId: string): Promise<number> {
      const [{ count }] = await tjdbManager().query(`SELECT COUNT(*) FROM "${schema}"."${relationId}"`);
      return Number(count);
    }

    async function confirmedBaselineSequences(tableId: string, relationId: string): Promise<number[]> {
      const rows = await appManager().query(
        `SELECT m.sequence FROM internal_table_migration_applications a
         JOIN internal_table_migrations m ON m.id = a.migration_id
         WHERE m.internal_table_id = $1 AND a.relation_id = $2 AND a.applied_at IS NOT NULL
         ORDER BY m.sequence`,
        [tableId, relationId]
      );
      return rows.map((r) => Number(r.sequence));
    }

    async function assign(tableId: string, organizationId: string) {
      const tjdbQueryRunner = getTooljetDbDataSource().createQueryRunner();
      await tjdbQueryRunner.connect();
      try {
        return await service.assignExistingTableToEnvironments(tableId, organizationId, appManager(), tjdbQueryRunner);
      } finally {
        await tjdbQueryRunner.release();
      }
    }

    /** `pg_dump --schema-only` for exactly one relation, run as a real separate connection against
     *  the physical TJDB database - not through the suite's transaction proxy, since B's claim is
     *  about the actual database state. Two kinds of line carry no signal and are stripped before
     *  comparison: `--` comments (a run timestamp) and pg16+'s `\restrict`/`\unrestrict` lines (a
     *  fresh random token every run, unrelated to the schema itself). */
    function schemaOnlyDump(schema: string, relationId: string): string {
      const options = getTooljetDbDataSource().options as any;
      const raw = execFileSync(
        'pg_dump',
        [
          '--schema-only',
          '--no-owner',
          '--no-privileges',
          '-h',
          options.host,
          '-p',
          String(options.port),
          '-U',
          options.username,
          '-d',
          options.database,
          '-t',
          `${schema}.${relationId}`,
        ],
        { env: { ...process.env, PGPASSWORD: options.password }, encoding: 'utf-8' }
      );
      return raw
        .split('\n')
        .filter(
          (line) =>
            line.trim() && !line.startsWith('--') && !line.startsWith('\\restrict') && !line.startsWith('\\unrestrict')
        )
        .join('\n');
    }

    it('licensed workspace: existing relation moves to production, an empty development twin is created', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-licensed@tooljet.io');
      const { tableId, schema } = await seedMigrationATable(organizationId, 'orders');

      const result = await assign(tableId, organizationId);

      const production = await priorityEnv(organizationId, 3);
      const development = await priorityEnv(organizationId, 1);

      expect(result).toMatchObject({ productionRelationId: tableId, developmentRelationId: expect.any(String) });
      expect(result.developmentRelationId).not.toEqual(tableId);

      expect((await relationRow(tableId)).environment_id).toEqual(production.id);
      expect(await physicalRowCount(schema, tableId)).toBe(1);

      const developmentRelation = await relationRow(result.developmentRelationId);
      expect(developmentRelation.environment_id).toEqual(development.id);
      expect(await physicalRowCount(schema, result.developmentRelationId)).toBe(0);

      // Task B0: the LIKE-cloned twin must come out owned by the workspace's tenant role, not the
      // TJDB admin that ran the CREATE TABLE.
      const [owner] = await getTooljetDbDataSource().query(
        `SELECT tableowner FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
        [schema, result.developmentRelationId]
      );
      expect(owner.tableowner).toBe(`user_${organizationId}`);
    });

    it('development inserts do not advance production sequence (serial default rewritten)', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-serial@tooljet.io');
      const { tableId, schema } = await seedMigrationATable(organizationId, 'invoices');

      const tjdbQueryRunner = getTooljetDbDataSource().createQueryRunner();
      await tjdbQueryRunner.connect();
      try {
        const result = await service.assignExistingTableToEnvironments(
          tableId,
          organizationId,
          appManager(),
          tjdbQueryRunner
        );

        const [{ last_value: productionBefore }] = await tjdbQueryRunner.query(
          `SELECT last_value FROM "${schema}"."${tableId}_id_seq"`
        );
        const [inserted] = await tjdbQueryRunner.query(
          `INSERT INTO "${schema}"."${result.developmentRelationId}" ("name") VALUES ('dev-row') RETURNING "id"`
        );
        const [{ last_value: productionAfter }] = await tjdbQueryRunner.query(
          `SELECT last_value FROM "${schema}"."${tableId}_id_seq"`
        );
        expect(String(productionAfter)).toEqual(String(productionBefore));

        // The inserted row got its id from the twin's own fresh sequence, starting at 1.
        expect(Number(inserted.id)).toEqual(1);
        const [{ is_called }] = await tjdbQueryRunner.query(
          `SELECT is_called FROM "${schema}"."${result.developmentRelationId}_id_seq"`
        );
        expect(is_called).toBe(true);
      } finally {
        await tjdbQueryRunner.release();
      }
    });

    it('ticks the baseline create migration against the development twin', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-tick@tooljet.io');
      const { tableId } = await seedMigrationATable(organizationId, 'customers');

      const result = await assign(tableId, organizationId);

      expect(await confirmedBaselineSequences(tableId, result.developmentRelationId)).toEqual([1]);
    });

    it('is idempotent: a second run changes nothing and never promotes an empty relation', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-idem@tooljet.io');
      const { tableId, schema } = await seedMigrationATable(organizationId, 'products');

      const first = await assign(tableId, organizationId);
      const second = await assign(tableId, organizationId);

      // Same twin, not a new one.
      expect(second.developmentRelationId).toEqual(first.developmentRelationId);

      const production = await priorityEnv(organizationId, 3);
      const productionRelations = await appManager().query(
        `SELECT id FROM internal_table_relations WHERE internal_table_id = $1 AND environment_id = $2`,
        [tableId, production.id]
      );
      expect(productionRelations).toHaveLength(1);
      expect(productionRelations[0].id).toEqual(tableId);

      // Safety invariant: the only `id === internal_table_id` row is still the migration-A row.
      const aShaped = await appManager().query(
        `SELECT id, environment_id FROM internal_table_relations WHERE id = internal_table_id AND internal_table_id = $1`,
        [tableId]
      );
      expect(aShaped).toHaveLength(1);
      expect(aShaped[0].id).toEqual(tableId);

      // Twin count exactly 1, still empty, applied set intact.
      const twins = await appManager().query(
        `SELECT id FROM internal_table_relations WHERE internal_table_id = $1 AND id <> internal_table_id`,
        [tableId]
      );
      expect(twins).toHaveLength(1);
      expect(await physicalRowCount(schema, first.developmentRelationId)).toBe(0);
      expect(await physicalRowCount(schema, tableId)).toBe(1);
      expect(await confirmedBaselineSequences(tableId, first.developmentRelationId)).toEqual([1]);
    });

    it('crash recovery: a re-run rebuilds a twin relation whose physical table went missing', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-crash@tooljet.io');
      const { tableId, schema } = await seedMigrationATable(organizationId, 'shipments');

      const first = await assign(tableId, organizationId);
      // Simulate a crash after the committed relation writes but before / during CREATE TABLE.
      await getTooljetDbDataSource().query(`DROP TABLE "${schema}"."${first.developmentRelationId}"`);

      const second = await assign(tableId, organizationId);

      expect(second.developmentRelationId).toEqual(first.developmentRelationId);
      expect(await physicalRowCount(schema, first.developmentRelationId)).toBe(0);
      expect(await confirmedBaselineSequences(tableId, first.developmentRelationId)).toEqual([1]);
    });

    it('licence gate: runMigrationB processes the licensed workspace and leaves the unlicensed one untouched', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const licensedOrgId = await newWorkspace('mig-b-gate-licensed@tooljet.io');
      const unlicensedOrgId = await newWorkspace('mig-b-gate-unlicensed@tooljet.io');
      const licensed = await seedMigrationATable(licensedOrgId, 'gate_licensed');
      const unlicensed = await seedMigrationATable(unlicensedOrgId, 'gate_unlicensed');

      const original = licenseTermsService.getLicenseTerms.bind(licenseTermsService);
      jest
        .spyOn(licenseTermsService, 'getLicenseTerms')
        .mockImplementation(async (field: any, organizationId?: any) => {
          if (field === LICENSE_FIELD.MULTI_ENVIRONMENT) return organizationId === licensedOrgId;
          return original(field, organizationId);
        });

      const tjdbQueryRunner = getTooljetDbDataSource().createQueryRunner();
      await tjdbQueryRunner.connect();
      try {
        await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.runMigrationB({
          licenseTermsService,
          environmentAssignmentService: service,
          tableOperationsService,
          appManager: appManager(),
          tjdbQueryRunner,
        });
      } finally {
        await tjdbQueryRunner.release();
      }

      const licensedProduction = await priorityEnv(licensedOrgId, 3);
      expect((await relationRow(licensed.tableId)).environment_id).toEqual(licensedProduction.id);
      expect(await twinIdFor(licensed.tableId)).toEqual(expect.any(String));

      const unlicensedDevelopment = await priorityEnv(unlicensedOrgId, 1);
      const unlicensedRelation = await relationRow(unlicensed.tableId);
      expect(unlicensedRelation.environment_id).toEqual(unlicensedDevelopment.id);
      expect(unlicensedRelation.internal_table_id).toEqual(unlicensed.tableId);
      expect(await twinIdFor(unlicensed.tableId)).toBeUndefined();
      expect(await physicalRowCount(unlicensed.schema, unlicensed.tableId)).toBe(1);
    });

    it('foreign-key pass is re-run safe: running runMigrationB twice keeps both baseline sequences confirmed', async () => {
      expect(tooljetDbAvailable).toBe(true);
      const organizationId = await newWorkspace('mig-b-fk@tooljet.io');
      const parent = await seedMigrationATable(organizationId, 'fk_parent');
      const child = await seedMigrationATable(organizationId, 'fk_child', parent.tableId);

      // Sanity: the child has a sequence-2 baseline FK migration.
      const childMigrations = await appManager().query(
        `SELECT sequence FROM internal_table_migrations WHERE internal_table_id = $1 ORDER BY sequence`,
        [child.tableId]
      );
      expect(childMigrations.map((m) => Number(m.sequence))).toEqual([1, 2]);

      const runOnce = async () => {
        const tjdbQueryRunner = getTooljetDbDataSource().createQueryRunner();
        await tjdbQueryRunner.connect();
        try {
          await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.runMigrationB({
            licenseTermsService,
            environmentAssignmentService: service,
            tableOperationsService,
            appManager: appManager(),
            tjdbQueryRunner,
          });
        } finally {
          await tjdbQueryRunner.release();
        }
      };

      await runOnce();
      const childTwin = await twinIdFor(child.tableId);
      expect(await confirmedBaselineSequences(child.tableId, childTwin)).toEqual([1, 2]);

      await runOnce();
      expect(await twinIdFor(child.tableId)).toEqual(childTwin);
      expect(await confirmedBaselineSequences(child.tableId, childTwin)).toEqual([1, 2]);
    });

    // The migration's real `up()` opens its own Nest context and its own TJDB DataSource - separate
    // connections that cannot see this suite's uncommitted transactions. `withRealTransactions`
    // rolls the suite transaction back so the seed rows commit for real; the callback builds the
    // workspace, runs the real migration, then drops the workspace + TJDB schema while the proxy is
    // still removed (cleanup must be inside the callback or the deletes get rolled back at afterAll).
    // The migration's own `internal_table*` writes go through the `queryRunner` transaction opened
    // here and are rolled back after the assertions; the TJDB tables live in a separate database
    // with no surrounding transaction, hence the explicit schema drop.
    //
    // Three FK'd tables on purpose: `replayForeignKeyBaseline` -> `applyMigrations` then runs under
    // the real connection topology twice, so a regression that releases the migration's shared TJDB
    // runner after the first replay would leave the later twins missing their sequence-2 row.
    //
    // MUST STAY LAST IN THE FILE (this one and the pg_dump test below it): `withRealTransactions`
    // rebuilds the suite transaction on exit, which discards the outer `beforeEach` savepoint - a
    // following *non*-`withRealTransactions` test's `afterEach` would then `ROLLBACK TO` a
    // savepoint that no longer exists and abort its transaction. Two `withRealTransactions` tests
    // back-to-back are fine - each resets the transaction itself on the way in and out.
    it('up(queryRunner): a real migration run moves a licensed workspace, including its FK twins', async () => {
      expect(tooljetDbAvailable).toBe(true);

      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-b-real-up-${uuidv4()}@tooljet.io`);
        try {
          const parent = await seedMigrationATable(organizationId, 'real_up_parent');
          const child1 = await seedMigrationATable(organizationId, 'real_up_child1', parent.tableId);
          const child2 = await seedMigrationATable(organizationId, 'real_up_child2', parent.tableId);

          const migration = new TjdbRolloutMigrationBEnvironmentAssignment1788252587903();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await migration.up(queryRunner);

            const [production] = await queryRunner.query(
              `SELECT id FROM app_environments WHERE organization_id = $1 AND priority = 3`,
              [organizationId]
            );
            const twinSequences = async (tableId: string): Promise<number[]> => {
              const rows = await queryRunner.query(
                `SELECT m.sequence FROM internal_table_migration_applications a
                 JOIN internal_table_migrations m ON m.id = a.migration_id
                 JOIN internal_table_relations r ON r.id = a.relation_id
                 WHERE m.internal_table_id = $1 AND r.id <> r.internal_table_id AND a.applied_at IS NOT NULL
                 ORDER BY m.sequence`,
                [tableId]
              );
              return rows.map((row) => Number(row.sequence));
            };

            for (const tableId of [parent.tableId, child1.tableId, child2.tableId]) {
              const [relation] = await queryRunner.query(
                `SELECT environment_id FROM internal_table_relations WHERE id = $1`,
                [tableId]
              );
              expect(relation.environment_id).toEqual(production.id);
            }
            expect(await twinSequences(parent.tableId)).toEqual([1]);
            expect(await twinSequences(child1.tableId)).toEqual([1, 2]);
            expect(await twinSequences(child2.tableId)).toEqual([1, 2]);
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await getTooljetDbDataSource()
            .query(`DROP SCHEMA IF EXISTS "workspace_${organizationId}" CASCADE`)
            .catch(() => undefined);
          await getDefaultDataSource()
            .query(`DELETE FROM organizations WHERE id = $1`, [organizationId])
            .catch(() => undefined);
        }
      });
    }, 180_000);

    // Real commit required: `pg_dump` opens its own connection outside any of this suite's
    // transactions, so it can only see rows/tables that were actually committed. MUST STAY LAST -
    // see the comment on the previous test.
    it('changes nothing about the pre-existing relation: pg_dump --schema-only is byte-identical before and after, filtered to the relation that already existed', async () => {
      expect(tooljetDbAvailable).toBe(true);

      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-b-pgdump-${uuidv4()}@tooljet.io`);
        try {
          const { tableId, schema } = await seedMigrationATable(organizationId, 'pgdump_tbl');

          // B never issues DDL against a pre-existing physical table - only its relation row's
          // environment_id changes. Filtering the dump to exactly this relation is what makes a
          // byte-identical result mean something: B does create new relations (the development
          // twin), and an unfiltered dump of the whole schema would trivially differ because of
          // those.
          const before = schemaOnlyDump(schema, tableId);
          await assign(tableId, organizationId);
          const after = schemaOnlyDump(schema, tableId);

          expect(after).toEqual(before);
        } finally {
          await getTooljetDbDataSource()
            .query(`DROP SCHEMA IF EXISTS "workspace_${organizationId}" CASCADE`)
            .catch(() => undefined);
          await getDefaultDataSource()
            .query(`DELETE FROM organizations WHERE id = $1`, [organizationId])
            .catch(() => undefined);
        }
      });
    }, 60_000);
  });
});
