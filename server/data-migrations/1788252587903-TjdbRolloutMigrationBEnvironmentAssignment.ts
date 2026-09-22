import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { LicenseTermsService, LicenseInitService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { MigrationProgress } from '@helpers/migration.helper';
import { findTenantSchema } from '@helpers/tooljet_db.helper';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
// Types only - the runtime classes resolve via dynamic import so the class reference matches the
// edition-specific DI token (mirrors SeedPushModulesBranch1776600000000).
import type { TooljetDbEnvironmentAssignmentService } from '@modules/tooljet-db/services/tooljet-db-environment-assignment.service';
import type { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import type LicenseBase from '@modules/licensing/configs/LicenseBase';

const MIGRATION_NAME = 'TjdbRolloutMigrationBEnvironmentAssignment1788252587903';

// ponytail: wall-clock bound, not a real cancellation - see the boot-time deadlock note in the
// class docblock. A real hang here can't be un-stuck from outside (no handle on the blocked
// query), so this only converts "hangs the deploy forever" into "fails fast with a clear cause".
const NEST_BOOT_TIMEOUT_MS = 120_000;

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
 * isolation.
 *
 * Boot-time deadlock risk: `NestFactory.createApplicationContext()` eagerly instantiates every
 * provider AND runs every `OnModuleInit`/`OnApplicationBootstrap` across the whole bootstrapped
 * `AppModule` graph before it returns (`instanceLoader.createInstancesOfDependencies()` +
 * `context.init()` in `@nestjs/core`'s `nest-factory.js`/`nest-application-context.js`) - this is
 * unconditional, before any `nestApp.get(...)` call below, so it is not narrowed to just the two
 * service classes' own dependency trees. Migration A (immediately before this one, same
 * transaction) holds `ACCESS EXCLUSIVE` on `internal_tables` until the *entire run* commits. If
 * anything on that boot path ever reads `internal_table*` on its own connection, this call
 * deadlocks forever: the lock can't release until this migration finishes, and this migration
 * can't finish until the boot does. Audited every `OnModuleInit`/`OnApplicationBootstrap`
 * reachable from `AppModule.register({ IS_GET_CONTEXT: true })` - none read `internal_table*`
 * today - but that's incidental, not structural, and won't survive the next module someone adds
 * to that graph.
 *
 * Hand-constructing `EnvironmentAssignmentClass`/`TableOperationsClass` to skip DI entirely was
 * considered and rejected: each drags 6+ further injectables (repositories, other services,
 * `EntityManager`s) transitively wired to `DataSource`s/config/event emitters - a hand-maintained
 * shadow DI graph that silently rots the first time any of those constructors change. So the boot
 * itself can't be avoided; instead it's wrapped in a bounded timeout below: a future regression
 * fails fast with a clear error naming the risk, instead of hanging the deploy indefinitely on a
 * lock wait with no indication why.
 *
 * Separately (not a fix for the above - the licence check never touched `internal_table*`): the
 * self-hosted licence check reads via `LicenseInitService.initForMigration(queryRunner.manager)`
 * rather than resolving `LicenseTermsService` and calling its runtime `getLicenseTerms()`, whose
 * `init()` path opens its own connection through `LicenseRepository`'s own transaction wrap -
 * a second connection competing for the same pool while this migration is holding one open for the
 * whole run. Cloud still goes through `LicenseTermsService.getLicenseTerms()` (its licence lives in
 * `organization_license`, fetched over HTTP, not `instance_settings`, and `initForMigration`
 * explicitly doesn't support Cloud).
 */
export class TjdbRolloutMigrationBEnvironmentAssignment1788252587903 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.withTimeout(
      NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true })),
      NEST_BOOT_TIMEOUT_MS,
      `${MIGRATION_NAME}: Nest boot exceeded ${NEST_BOOT_TIMEOUT_MS}ms. This almost always means an ` +
        `OnModuleInit/OnApplicationBootstrap somewhere in the AppModule graph is blocked waiting on a ` +
        `lock held by migration A's ACCESS EXCLUSIVE on internal_tables (see class docblock) - check ` +
        `for a provider newly reading internal_table* on boot.`
    );
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
      const { default: License } = await import(`${importPath}/licensing/configs/License`);

      await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.runMigrationB({
        licenseTermsService: nestApp.get(LicenseTermsService, { strict: false }),
        licenseInitService: nestApp.get(LicenseInitService, { strict: false }),
        License,
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
        // Physical DROP runs on a separate connection outside this migration's transaction, so it
        // can't be rolled back. Do the transactional app-DB writes first, drop only once both
        // succeeded — this iteration alone can't leave a real inconsistency. Across the whole run
        // (migrationsTransactionMode: 'all') a LATER twin's failure still rolls back every
        // app-DB write this loop already made, including this iteration's, while this iteration's
        // physical DROP stays applied. Not a live bug: the app-DB rows are back exactly as they
        // were pre-run, so a retry re-selects the same twins and re-runs the whole loop from
        // scratch, and DROP TABLE IF EXISTS makes redoing an already-dropped twin's drop a no-op.
        await queryRunner.query(`DELETE FROM internal_table_relations WHERE id = $1`, [twin.twin_id]);
        await queryRunner.query(`UPDATE internal_table_relations SET environment_id = $1 WHERE id = $2`, [
          twin.dev_env_id,
          twin.a_relation_id,
        ]);
        await tjdbQueryRunner.query(`DROP TABLE IF EXISTS "${schema}"."${twin.twin_id}" CASCADE`);
      }
    } finally {
      await tjdbQueryRunner.release();
      await tjdbConnection.destroy();
    }
  }

  /**
   * Races `promise` against `ms` and rejects with `message` on timeout, so a real hang surfaces as
   * a fast, actionable error instead of hanging the migration run forever - see the boot-time
   * deadlock note above. A static method, not a standalone top-level export, for the same reason
   * as `runMigrationB` below: TypeORM's migration loader treats every top-level function export in
   * this directory as a migration class to instantiate, so a bare `export function` here blows up
   * `migration:run` with "TypeError: ... is not a constructor".
   */
  public static withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  /**
   * Self-hosted (CE/EE): reads the instance licence through `queryRunner.manager` via
   * `initForMigration` - no DI, no separate connection competing with this migration's own
   * transaction for the pool. `initForMigration` checks `TJ_LICENSE` itself (decrypts it inline)
   * before falling back to the DB-stored `instance_settings.LICENSE_KEY` row, so this is correct
   * for both env- and DB-licensed self-hosted instances without depending on `onModuleInit` having
   * run first - see `LicenseInitService.initForMigration`'s own comment. Cloud licences live in
   * `organization_license`/HTTP, not `instance_settings`, and `initForMigration` explicitly doesn't
   * support Cloud, so Cloud keeps going through `LicenseTermsService.getLicenseTerms()` (its
   * existing, unrelated cost - see class docblock).
   */
  private static async isMultiEnvironmentLicensed(
    organizationId: string,
    deps: Pick<MigrationBDeps, 'licenseTermsService' | 'licenseInitService' | 'License' | 'appManager'>
  ): Promise<boolean> {
    const { licenseTermsService, licenseInitService, License, appManager } = deps;
    if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      return licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId);
    }
    await licenseInitService.initForMigration(appManager);
    return licenseInitService.getLicenseFieldValue(LICENSE_FIELD.MULTI_ENVIRONMENT, License.Instance());
  }

  /**
   * The workspace loop. A static method (not a standalone top-level export) so the e2e suite can
   * drive it with a real (non-proxied) QueryRunner's manager instead of booting a second Nest
   * context inside Jest - TypeORM's migration loader treats every top-level function export in
   * this directory as a migration class to instantiate, so a bare `export async function` here
   * blows up `migration:run` with "TypeError: ... is not a constructor".
   */
  public static async runMigrationB(deps: MigrationBDeps): Promise<void> {
    const {
      licenseTermsService,
      licenseInitService,
      License,
      environmentAssignmentService,
      tableOperationsService,
      appManager,
      tjdbQueryRunner,
    } = deps;

    const organizations: Array<{ id: string }> = await appManager.query(`SELECT id FROM organizations`);
    console.log(
      `${MIGRATION_NAME}: [START] Assigning TJDB data to environments: ${organizations.length} workspace(s).`
    );
    const progress = new MigrationProgress(MIGRATION_NAME, organizations.length || 1);

    for (const { id: organizationId } of organizations) {
      try {
        const licensed = await TjdbRolloutMigrationBEnvironmentAssignment1788252587903.isMultiEnvironmentLicensed(
          organizationId,
          { licenseTermsService, licenseInitService, License, appManager }
        );
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
            // ROLLBACK TO SAVEPOINT leaves the savepoint on the stack; RELEASE is what pops it —
            // both loops swallow the error and continue, so without this every failed table leaks
            // one subtransaction for the rest of the workspace's run.
            await appManager.query(`ROLLBACK TO SAVEPOINT tjdb_env_assignment`);
            await appManager.query(`RELEASE SAVEPOINT tjdb_env_assignment`);
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
            await appManager.query(`RELEASE SAVEPOINT tjdb_env_fk_replay`);
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
  licenseInitService: LicenseInitService;
  // Edition-resolved License config class (dynamically imported, same as EnvironmentAssignmentClass
  // below) - only its static Instance() accessor is used, so the generic LicenseBase shape suffices.
  License: { Instance(): LicenseBase };
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
