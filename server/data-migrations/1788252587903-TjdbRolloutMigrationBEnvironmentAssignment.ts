import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getImportPath } from '@modules/app/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { MigrationProgress } from '@helpers/migration.helper';
import { findTenantSchema } from '@helpers/tooljet_db.helper';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
// Types only - the runtime classes resolve via dynamic import so the class reference matches the
// edition-specific DI token (mirrors SeedPushModulesBranch1776600000000).
import type { TooljetDbEnvironmentAssignmentService } from '@modules/tooljet-db/services/tooljet-db-environment-assignment.service';
import type { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';

const MIGRATION_NAME = 'TjdbRolloutMigrationBEnvironmentAssignment1788252587903';

/**
 * "Migration B": corrects migration A's unconditional development placement for licensed
 * workspaces. A licensed workspace's pre-existing TJDB tables are production data (released apps
 * already serve from them), so their relation is re-pointed to the highest-priority environment
 * and an empty development twin is created to author in. Unlicensed workspaces are already correct
 * from A and are skipped. Licence bought later moves nothing - the first promote's find-or-create
 * handles it. No cutover flag, no admin action.
 *
 * See src/modules/tooljet-db/AGENTS.md for the environments data model this assigns into.
 *
 * Revert order (not enforced mechanically — both datasources share one `migrations` table,
 * reverted by insertion id, not timestamp): this migration (down) -> Migration A
 * (data-migrations/1787564882760-TjdbRolloutMigrationASubstrate.ts, down) ->
 * TjdbRolloutSubstrateSchema1787564882000 (down). A duplicate-baseline bug would surface here
 * first, since B is the first thing to read Migration A's baseline rows.
 *
 * B is a data migration under `migrationsTransactionMode: 'all'` - it shares migration A's single
 * uncommitted transaction on `queryRunner`. All `internal_table*` work therefore goes through
 * `queryRunner.manager`, exactly as migration A does, with a `SAVEPOINT` per table for row
 * isolation. The Nest context is booted only to resolve the edition-correct service classes and to
 * read the per-workspace licence (`licenseInitService.init()` reads `instance_settings` / the
 * `TJ_LICENSE` env var and an in-memory `License.Instance()` - it never touches `internal_table*`
 * and never lock-waits).
 */
export class TjdbRolloutMigrationBEnvironmentAssignment1788252587903 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const tjdbConnection = new DataSource({ ...tooljetDbOrmconfig, name: `${MIGRATION_NAME}Tjdb` } as any);
    await tjdbConnection.initialize();
    const tjdbQueryRunner = tjdbConnection.createQueryRunner();
    await tjdbQueryRunner.connect();

    try {
      const importPath = await getImportPath(true);
      const { TooljetDbEnvironmentAssignmentService: EnvironmentAssignmentClass } = await import(
        `${importPath}/tooljet-db/services/tooljet-db-environment-assignment.service`
      );
      const { TooljetDbTableOperationsService: TableOperationsClass } = await import(
        `${importPath}/tooljet-db/services/tooljet-db-table-operations.service`
      );

      await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.runMigrationB({
        licenseTermsService: nestApp.get(LicenseTermsService, { strict: false }),
        environmentAssignmentService: nestApp.get(EnvironmentAssignmentClass, { strict: false }),
        tableOperationsService: nestApp.get(TableOperationsClass, { strict: false }),
        appManager: queryRunner.manager,
        tjdbQueryRunner,
      });
    } finally {
      await tjdbQueryRunner.release();
      await tjdbConnection.destroy();
      await nestApp.close();
    }
  }

  /**
   * Drops every development twin B created, deletes its relation row (applications cascade), and
   * re-points the production relation back to the priority-1 environment. After this,
   * `id === internal_table_id` holds again for every surviving relation.
   *
   * Destructive by nature: a twin that a Builder authored in after B ran - added columns, rows -
   * is dropped with everything in it. That is inherent to reversing B (development IS the twin),
   * not a bug. Single-environment workspaces (`MAX(priority) = 1`) are skipped: production and
   * development resolve to the same row, so B never created a twin there.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const tjdbConnection = new DataSource({ ...tooljetDbOrmconfig, name: `${MIGRATION_NAME}TjdbDown` } as any);
    await tjdbConnection.initialize();
    const tjdbQueryRunner = tjdbConnection.createQueryRunner();
    await tjdbQueryRunner.connect();

    try {
      const twins = await queryRunner.query(`
        SELECT twin.id AS twin_id,
               a.id AS a_relation_id,
               dev.id AS dev_env_id,
               it.organization_id AS organization_id
        FROM internal_table_relations a
        JOIN internal_tables it ON it.id = a.internal_table_id
        JOIN app_environments prod ON prod.id = a.environment_id
        JOIN app_environments dev ON dev.organization_id = it.organization_id AND dev.priority = 1
        JOIN internal_table_relations twin
          ON twin.internal_table_id = a.internal_table_id
         AND twin.environment_id = dev.id
         AND twin.id <> twin.internal_table_id
        WHERE a.id = a.internal_table_id
          AND prod.priority = (SELECT MAX(priority) FROM app_environments WHERE organization_id = it.organization_id)
          AND prod.priority <> 1
      `);

      for (const twin of twins) {
        const schema = findTenantSchema(twin.organization_id);
        await tjdbQueryRunner.query(`DROP TABLE IF EXISTS "${schema}"."${twin.twin_id}" CASCADE`);
        await queryRunner.query(`DELETE FROM internal_table_relations WHERE id = $1`, [twin.twin_id]);
        await queryRunner.query(`UPDATE internal_table_relations SET environment_id = $1 WHERE id = $2`, [
          twin.dev_env_id,
          twin.a_relation_id,
        ]);
      }
    } finally {
      await tjdbQueryRunner.release();
      await tjdbConnection.destroy();
    }
  }

  /**
   * The workspace loop. A static method (not a standalone top-level export) so the e2e suite can
   * drive it with a real (non-proxied) QueryRunner's manager instead of booting a second Nest
   * context inside Jest - TypeORM's migration loader treats every top-level function export in
   * this directory as a migration class to instantiate, so a bare `export async function` here
   * blows up `migration:run` with "TypeError: ... is not a constructor".
   */
  public static async runMigrationB(deps: MigrationBDeps): Promise<void> {
    const { licenseTermsService, environmentAssignmentService, tableOperationsService, appManager, tjdbQueryRunner } =
      deps;

    const organizations: Array<{ id: string }> = await appManager.query(`SELECT id FROM organizations`);
    console.log(
      `${MIGRATION_NAME}: [START] Assigning TJDB data to environments: ${organizations.length} workspace(s).`
    );
    const progress = new MigrationProgress(MIGRATION_NAME, organizations.length || 1);

    for (const { id: organizationId } of organizations) {
      try {
        const licensed = await licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId);
        if (!licensed) continue;

        const tables: Array<{ id: string }> = await appManager.query(
          `SELECT id FROM internal_tables WHERE organization_id = $1 AND deleted_at IS NULL`,
          [organizationId]
        );

        // Pass 1: re-point every migration-A relation to production and create its development twin.
        // SAVEPOINT per table (migration A's pattern) - one bad row cannot poison the shared transaction.
        for (const { id: internalTableId } of tables) {
          await appManager.query(`SAVEPOINT tjdb_env_assignment`);
          try {
            await environmentAssignmentService.assignExistingTableToEnvironments(
              internalTableId,
              organizationId,
              appManager,
              tjdbQueryRunner
            );
            await appManager.query(`RELEASE SAVEPOINT tjdb_env_assignment`);
          } catch (error) {
            await appManager.query(`ROLLBACK TO SAVEPOINT tjdb_env_assignment`);
            console.error(
              `${MIGRATION_NAME}: workspace=${organizationId} table=${internalTableId} assignment failed; continuing.`,
              error
            );
          }
        }

        // Pass 2: replay each baseline foreign-key migration, once every development twin in the
        // workspace exists (a baseline FK resolves its referenced table in the twin's own environment).
        // SAVEPOINT per table: applyMigrations runs adjudicatePending + recordApplications on the
        // shared transaction *before* its own inner savepoint, so an error there would otherwise
        // abort the whole migration run.
        for (const { id: internalTableId } of tables) {
          await appManager.query(`SAVEPOINT tjdb_env_fk_replay`);
          try {
            await replayForeignKeyBaseline(appManager, tableOperationsService, tjdbQueryRunner, internalTableId);
            await appManager.query(`RELEASE SAVEPOINT tjdb_env_fk_replay`);
          } catch (error) {
            await appManager.query(`ROLLBACK TO SAVEPOINT tjdb_env_fk_replay`);
            console.error(
              `${MIGRATION_NAME}: workspace=${organizationId} table=${internalTableId} foreign-key replay failed; continuing.`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`${MIGRATION_NAME}: workspace=${organizationId} failed; continuing.`, error);
      } finally {
        progress.show();
      }
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Environment assignment finished.`);
  }
}

interface MigrationBDeps {
  licenseTermsService: LicenseTermsService;
  environmentAssignmentService: TooljetDbEnvironmentAssignmentService;
  tableOperationsService: TooljetDbTableOperationsService;
  appManager: EntityManager;
  tjdbQueryRunner: QueryRunner;
}

async function replayForeignKeyBaseline(
  appManager: EntityManager,
  tableOperationsService: TooljetDbTableOperationsService,
  tjdbQueryRunner: QueryRunner,
  internalTableId: string
): Promise<void> {
  const [fkMigration] = await appManager.query(
    `SELECT id FROM internal_table_migrations
     WHERE internal_table_id = $1 AND kind = 'baseline' AND sequence = 2`,
    [internalTableId]
  );
  if (!fkMigration) return;

  const [twin] = await appManager.query(
    `SELECT r.id, r.internal_table_id, r.environment_id, r.branch_id, r.configurations
     FROM internal_table_relations r
     JOIN app_environments e ON e.id = r.environment_id
     WHERE r.internal_table_id = $1 AND e.priority = 1 AND r.id <> r.internal_table_id`,
    [internalTableId]
  );
  if (!twin) return;

  // Re-run safety: the FK is already on the twin and applyMigrations' catch would delete the
  // confirmed application row on the "constraint already exists" error.
  const [alreadyApplied] = await appManager.query(
    `SELECT 1 FROM internal_table_migration_applications
     WHERE migration_id = $1 AND relation_id = $2 AND applied_at IS NOT NULL`,
    [fkMigration.id, twin.id]
  );
  if (alreadyApplied) return;

  const twinRelation = appManager.getRepository(InternalTableRelation).create({
    id: twin.id,
    internalTableId: twin.internal_table_id,
    environmentId: twin.environment_id,
    branchId: twin.branch_id,
    configurations: twin.configurations,
  });
  // `.connection.manager` (not `tjdbQueryRunner.manager`): a manager with no bound query runner, so
  // applyMigrations creates and releases its *own* TJDB runner per call. Handing it B's long-lived
  // runner would let applyMigrations' `finally` release it, breaking every later TJDB statement.
  await tableOperationsService.applyMigrations([fkMigration.id], twinRelation, {
    appManager,
    tjdbManager: tjdbQueryRunner.connection.manager,
  });
}
