/**
 * Covers: migration-helpers/legacy-3-21-58-upgrade.ts, run-all-migrations.ts, helpers/branch_scope.helper.ts and the
 * repository reads that use it, migrations/cleanup/1793300000000-CleanupLegacyBranchModel.ts
 * @group database
 */
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { appVersionOnBranch, nullBranchLast } from 'src/helpers/branch_scope.helper';
import {
  LEGACY_LOOSEN_RULES,
  LEGACY_BRANCH_MIGRATION,
  loosenLegacyRules,
  restoreLegacyRules,
} from 'src/migration-helpers/legacy-3-21-58-upgrade';
import { classifyLocks, MigrationPart } from 'src/migration-helpers/lock-probe';
import { LOCK_SENTINEL_MIGRATION_NAMES } from 'src/migration-helpers/migration-locks';
import { isPreCutoffMigration, MigrationPhase } from 'src/migration-helpers/migration-mode';
import { UserAppsPermissions, UserPermissions } from 'src/modules/ability/types';
import { MODULES } from 'src/modules/app/constants/modules';
import { APP_TYPES } from 'src/modules/apps/constants';
import { AppsRepository } from 'src/modules/apps/repository';
import { DataSourcesRepository } from 'src/modules/data-sources/repository';
import { FolderAppsUtilService } from 'src/modules/folder-apps/util.service';
import { VersionRepository } from 'src/modules/versions/repository';
import {
  createScratchDatabase,
  dropScratchDatabase,
  postgres,
  SERVER_ROOT,
  waitFor,
  withScratchConnection,
} from '../fixtures/harness';

/**
 * Blocking mode runs every migration in one transaction before the server starts. Async mode runs schema,
 * then data (with the 3.21.58 stand-ins), then cleanup. From a 3.21.58 snapshot, both must end in the same place.
 * Delete with legacy-3-21-58-upgrade.ts when 3.21.58 upgrades are no longer supported.
 */

const CLEANUP_MIGRATION = 'CleanupLegacyBranchModel1793300000000';
const RUN_TIMEOUT_MS = 10 * 60_000;
const GITOFF = '7b4aec54-0ec4-465b-8c73-a65eb274f2a3';
const GITON = '8b930517-7801-4b07-bd19-7eea1b3beabd';

const blockingDatabase = `tooljet_legacy_blocking_${process.pid}`;
const asyncDatabase = `tooljet_legacy_async_${process.pid}`;
const failingDatabase = `tooljet_legacy_failing_${process.pid}`;
const unmetRuleDatabase = `tooljet_legacy_unmet_rule_${process.pid}`;
const lateWritesDatabase = `tooljet_legacy_late_writes_${process.pid}`;

interface FirstUpgrade {
  /** Output of the run that would have applied the cleanup. */
  output: string;
  migrations: string[];
}

interface FirstAsyncUpgrade extends FirstUpgrade {
  dataOutput: string;
  tablesBeforeData: string[];
  readsAfterSchema: RepositoryReads;
  readsAfterData: RepositoryReads;
}

describe('Upgrading a 3.21.58 database', () => {
  let blocking: FirstUpgrade;
  let async: FirstAsyncUpgrade;
  let rowsAfterFirstUpgrade: Record<string, string[]>[];

  beforeAll(async () => {
    await Promise.all([blockingDatabase, asyncDatabase].map(restoreFixture));
    [blocking, async] = await Promise.all([
      firstUpgradeInBlockingMode(blockingDatabase),
      firstUpgradeInAsyncMode(asyncDatabase),
    ]);
    // The paths differ in schema until cleanup, so compare what both have.
    const shared = await sharedColumns(blockingDatabase, asyncDatabase);
    rowsAfterFirstUpgrade = maskNewIds(
      ...(await Promise.all([rowsOf(blockingDatabase, shared), rowsOf(asyncDatabase, shared)]))
    );

    // Next release: dropping the baseline lets the held-back cleanup run.
    await Promise.all([blockingDatabase, asyncDatabase].map(dropBaseline));
    await Promise.all([runOk(blockingDatabase), runOk(asyncDatabase, 'cleanup')]);
  }, RUN_TIMEOUT_MS);

  afterAll(async () => {
    await Promise.all(
      [blockingDatabase, asyncDatabase, failingDatabase, unmetRuleDatabase, lateWritesDatabase].map(dropScratchDatabase)
    );
  });

  it('should hold the cleanup back on the first upgrade, which installs the release it waits for, and apply it on the next', async () => {
    for (const [database, first] of [
      [blockingDatabase, blocking],
      [asyncDatabase, async],
    ] as const) {
      expect(first.output).toContain(`Holding back ${CLEANUP_MIGRATION}`);
      expect(first.migrations).not.toContain(CLEANUP_MIGRATION);
      expect(await migrationNames(database)).toContain(CLEANUP_MIGRATION);
    }
  });

  it('should take no lock in the data phase that stalls 3.21.58 pods, except in the statement just before commit', () => {
    const tablesBeforeData = new Set(async.tablesBeforeData);
    const allLocks = [...async.dataOutput.matchAll(/^\[lock\] (\d+) (\w+) (up|beforeCommit): (\w+) (\w+)$/gm)].map(
      ([, statement, migration, part, table, mode]) => ({
        statement: Number(statement),
        migration,
        part: part as MigrationPart,
        table,
        mode,
      })
    );
    const lastStatement = Math.max(...allLocks.map(({ statement }) => statement));
    // Later migrations follow the authoring rules and are lock-probed in CI.
    const locks = allLocks.filter(
      ({ migration, table }) => isPreCutoffMigration(migration) && tablesBeforeData.has(table)
    );
    const stalling = locks.filter(
      ({ part, table, mode }) => classifyLocks('data', part, [{ table, mode, existed: true }]).length > 0
    );
    // The branch key swap is the last statement before commit, so it holds its locks for milliseconds.
    const isBranchKeySwap = ({ statement, migration, part }: (typeof locks)[number]) =>
      statement === lastStatement && migration === LEGACY_BRANCH_MIGRATION && part === 'beforeCommit';

    expect(locks.length).toBeGreaterThan(0);
    expect(stalling.length).toBeGreaterThan(0);
    expect(stalling.filter((lock) => !isBranchKeySwap(lock))).toEqual([]);
  });

  it('should read the same apps, versions, data sources and folder apps through the repositories before and after the data phase', () => {
    expect(Object.keys(async.readsAfterSchema)).toEqual([GITOFF, GITON].sort());
    expect(async.readsAfterData).toEqual(async.readsAfterSchema);
  });

  it('should have the same rows as a single-transaction upgrade once the data phase is done, before cleanup', () => {
    const [blockingRows, asyncRows] = rowsAfterFirstUpgrade;

    expect(difference(blockingRows, asyncRows)).toEqual({});
  });

  it('should end with the same tables, columns, indexes and functions as a single-transaction upgrade', async () => {
    const [blockingSchema, asyncSchema] = await Promise.all([schemaOf(blockingDatabase), schemaOf(asyncDatabase)]);

    expect(difference(blockingSchema, asyncSchema)).toEqual({});
  });

  it('should end with the same rows as a single-transaction upgrade', async () => {
    const [blockingRows, asyncRows] = maskNewIds(
      ...(await Promise.all([rowsOf(blockingDatabase), rowsOf(asyncDatabase)]))
    );

    expect(difference(blockingRows, asyncRows)).toEqual({});
  });

  it(
    'should put back the constraints and indexes the data phase dropped, when the data phase fails',
    async () => {
      await restoreFixture(failingDatabase);
      await runOk(failingDatabase, 'schema');
      const rulesBeforeData = await loosenedRules(failingDatabase);
      expect(rulesBeforeData).toHaveLength(LEGACY_LOOSEN_RULES.length);
      await failTheDataPhase(failingDatabase);

      const { exitCode, output } = await runRunner(failingDatabase, 'data');

      expect(exitCode).not.toBe(0);
      expect(output).toContain('injected data failure');
      expect(output).toContain(`Legacy upgrade: dropped ${LEGACY_LOOSEN_RULES.length} old rules`);
      expect(await loosenedRules(failingDatabase)).toEqual(rulesBeforeData);
      await withScratchConnection(failingDatabase, async (db) => {
        expect(await db.query('SELECT name FROM migrations')).not.toContainEqual({ name: LEGACY_BRANCH_MIGRATION });
        // Rules saved before the drop and not put back yet.
        expect(await db.query('SELECT name FROM legacy_upgrade_dropped_rules')).toEqual([]);
        // 3.21.58 refuses these writes again.
        await expect(releaseOnTheDefaultBranch(db, DRAFT_GITON)).rejects.toMatchObject({ code: '23514' });
        await expect(
          db.query(
            `INSERT INTO data_source_versions (data_source_id, name, branch_id, is_default, is_active)
             SELECT data_source_id, upper(name), branch_id, false, true FROM data_source_versions WHERE id = $1`,
            [BUSINESS_ANALYTICS_ON_MAIN]
          )
        ).rejects.toMatchObject({ code: '23505' });
      });
    },
    RUN_TIMEOUT_MS
  );

  it(
    'should put back a check that rows written meanwhile no longer meet unchecked, still refusing new rows, and report it',
    async () => {
      await restoreFixture(unmetRuleDatabase);
      await runOk(unmetRuleDatabase, 'schema');

      const problems = await withScratchConnection(unmetRuleDatabase, async (db) => {
        await loosenLegacyRules(db);
        // A 3.21.58 pod writes while the rule is gone.
        await releaseOnTheDefaultBranch(db, DRAFT_GITON);
        return restoreLegacyRules(db);
      });

      expect(problems).toEqual([expect.stringMatching(/^chk_app_versions_branched_implies_draft: /)]);
      await withScratchConnection(unmetRuleDatabase, async (db) => {
        expect(
          await db.query(
            `SELECT convalidated FROM pg_constraint WHERE conname = 'chk_app_versions_branched_implies_draft'`
          )
        ).toEqual([{ convalidated: false }]);
        await expect(releaseOnTheDefaultBranch(db, MORTGAGE_GITON_DRAFT)).rejects.toMatchObject({ code: '23514' });
        // Kept for the next restore.
        expect(await db.query('SELECT name FROM legacy_upgrade_dropped_rules')).toEqual([
          { name: 'chk_app_versions_branched_implies_draft' },
        ]);
      });
    },
    RUN_TIMEOUT_MS
  );

  it(
    'should move rows old 3.21.58 pods write during and after the data phase onto the default branch during cleanup',
    async () => {
      await restoreFixture(lateWritesDatabase);
      await runOk(lateWritesDatabase, 'schema');
      // After the data phase gave every app version a branch, before it commits the check that forbids NULL.
      await runDataPhasePausedAfter(LEGACY_BRANCH_MIGRATION, lateWritesDatabase, (db) =>
        db.query(OLD_POD_CREATES_AN_APP)
      );
      await withScratchConnection(lateWritesDatabase, async (db) => {
        await db.query(OLD_POD_CREATES_DATA_SOURCES_AND_FILES_THE_APP);
        expect(
          await db.query(
            `SELECT (SELECT count(*) FROM app_versions WHERE branch_id IS NULL)::int AS app_versions,
                    (SELECT count(*) FROM data_source_versions WHERE branch_id IS NULL)::int AS data_source_versions,
                    (SELECT count(*) FROM folder_apps WHERE branch_id IS NULL)::int AS folder_apps`
          )
        ).toEqual([{ app_versions: 1, data_source_versions: 2, folder_apps: 1 }]);
      });
      await dropBaseline(lateWritesDatabase);

      await runOk(lateWritesDatabase, 'cleanup');

      expect(await migrationNames(lateWritesDatabase)).toContain(CLEANUP_MIGRATION);
      expect(await oldPodRowsOnDefaultBranch(lateWritesDatabase)).toEqual([
        { rows: 'app_versions', workspace: 'gitoff', on_default_branch: true },
        { rows: 'data_source_versions', workspace: 'gitoff', on_default_branch: true },
        { rows: 'data_source_versions', workspace: 'giton', on_default_branch: true },
        { rows: 'folder_apps', workspace: 'gitoff', on_default_branch: true },
      ]);
    },
    RUN_TIMEOUT_MS
  );
});

/** 3.21.58 rows have no branch until the data phase; reads must still find them on the default branch. */
describe('helpers/branch_scope: finding 3.21.58 rows that have no branch yet', () => {
  const DEFAULT = '00000000-0000-0000-0000-00000000000d';
  const FEATURE = '00000000-0000-0000-0000-00000000000f';
  const database = `tooljet_branch_scope_${process.pid}`;
  let db: DataSource;

  beforeAll(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
    await db.query(`
      CREATE TABLE organization_git_sync_branches (id uuid PRIMARY KEY, is_default boolean NOT NULL);
      CREATE TABLE apps (id text PRIMARY KEY, type text NOT NULL);
      CREATE TABLE app_versions (id text PRIMARY KEY, app_id text NOT NULL, branch_id uuid);
      INSERT INTO organization_git_sync_branches VALUES ('${DEFAULT}', true), ('${FEATURE}', false);
      INSERT INTO apps VALUES ('app', 'front-end'), ('flow', 'workflow');
      INSERT INTO app_versions VALUES
        ('legacy', 'app', NULL),
        ('on-default', 'app', '${DEFAULT}'),
        ('on-feature', 'app', '${FEATURE}'),
        ('workflow', 'flow', NULL);
    `);
  }, 60_000);

  afterAll(async () => {
    await db?.destroy().catch(() => undefined);
    await dropScratchDatabase(database);
  }, 60_000);

  it.each([
    ['the default branch', DEFAULT, ['on-default', 'legacy']],
    ['a feature branch', FEATURE, ['on-feature']],
    ['a workspace with git sync off (no default branch yet)', null, ['legacy']],
  ])(
    'should show the same app versions 3.21.58 showed for %s, a branched copy before its old copy',
    async (_on, branchId, expected) => {
      const versions = await db
        .createQueryBuilder()
        .select('av.id', 'id')
        .from('app_versions', 'av')
        .where(appVersionOnBranch('av', 'branchId'), { branchId })
        .orderBy(nullBranchLast('av.branch_id'), 'ASC')
        .getRawMany();

      expect(versions.map(({ id }) => id)).toEqual(expected);
    }
  );
});

/** Blocking mode: the whole upgrade in one transaction, cleanup held back. */
async function firstUpgradeInBlockingMode(database: string): Promise<FirstUpgrade> {
  const output = await runOk(database);
  return { output, migrations: await migrationNames(database) };
}

/** Async mode: schema, data, cleanup (held back), with repository reads on each side of the data phase. */
async function firstUpgradeInAsyncMode(database: string): Promise<FirstAsyncUpgrade> {
  await runOk(database, 'schema');
  const tablesBeforeData = await withScratchConnection(database, async (db) =>
    ((await db.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)) as { tablename: string }[]).map(
      ({ tablename }) => tablename
    )
  );
  const readsAfterSchema = await readThroughRepositories(database);
  const dataOutput = await runOk(database, 'data', [join(__dirname, '../fixtures/print-data-phase-locks.js')]);
  const readsAfterData = await readThroughRepositories(database);
  const output = await runOk(database, 'cleanup');
  return {
    output,
    migrations: await migrationNames(database),
    dataOutput,
    tablesBeforeData,
    readsAfterSchema,
    readsAfterData,
  };
}

const FIXTURE_SQL = join(__dirname, '../fixtures/3-21-58-database.sql');
const RUNNER = join(SERVER_ROOT, 'src/migration-helpers/run-all-migrations.ts');

interface RunnerOutcome {
  exitCode: number | null;
  output: string;
}

/** A fresh scratch database holding the 3.21.58 snapshot. */
async function restoreFixture(database: string): Promise<void> {
  await createScratchDatabase(database);
  await withScratchConnection(database, (db) => db.query(readFileSync(FIXTURE_SQL, 'utf8')));
}

function migrationNames(database: string): Promise<string[]> {
  return withScratchConnection(database, async (db) =>
    ((await db.query('SELECT name FROM migrations')) as { name: string }[]).map(({ name }) => name)
  );
}

/** What the next release does: a new code head, so held-back cleanups may run. */
function dropBaseline(database: string) {
  return withScratchConnection(database, (db) => db.query('DELETE FROM migration_baselines'));
}

/** The real runner with the real migrations. NODE_ENV=test would list no schema migrations (ormconfig.ts). */
function runRunner(database: string, phase?: MigrationPhase, preload: string[] = []): Promise<RunnerOutcome> {
  const { host, port, username, password } = postgres;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'development',
    TS_NODE_PROJECT: 'tsconfig.json',
    DATABASE_URL: `postgres://${username}:${password}@${host}:${port}/${database}?sslmode=disable`,
  };
  delete env.MIGRATION_PHASE;
  if (phase) env.MIGRATION_PHASE = phase;
  const child = spawn(
    process.execPath,
    [
      '-r',
      'ts-node/register/transpile-only',
      '-r',
      'tsconfig-paths/register',
      ...preload.flatMap((file) => ['-r', file]),
      RUNNER,
    ],
    { cwd: SERVER_ROOT, env }
  );
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  return new Promise((resolve) => child.on('close', (exitCode) => resolve({ exitCode, output })));
}

/** Runs the runner and throws unless it exits 0. Returns its output. */
async function runOk(database: string, phase?: MigrationPhase, preload?: string[]): Promise<string> {
  const { exitCode, output } = await runRunner(database, phase, preload);
  if (exitCode !== 0)
    throw new Error(`runner (${phase ?? 'single-transaction'}) exited ${exitCode}:\n${output.slice(-4000)}`);
  return output;
}

// --- Reads the new release serves while the data phase runs ---

type RepositoryReads = Record<string, Record<string, unknown>>;

/** For each workspace: what the repositories return for every app, data source and folder, by id. */
async function readThroughRepositories(database: string): Promise<RepositoryReads> {
  const db = await new DataSource({
    type: 'postgres',
    ...postgres,
    database,
    entities: [join(SERVER_ROOT, '{src,ee}/**/*.entity.ts')],
  }).initialize();
  const apps = new AppsRepository(db);
  const versions = new VersionRepository(db);
  const dataSources = new DataSourcesRepository(db);
  const folderApps = new FolderAppsUtilService(null);
  const admin = {
    isAdmin: true,
    isSuperAdmin: true,
    [MODULES.GLOBAL_DATA_SOURCE]: { isAllConfigurable: true, isAllUsable: true },
  } as unknown as UserPermissions;
  const ids = (rows: { id: string }[]) => rows.map(({ id }) => id).sort();
  try {
    const reads: RepositoryReads = {};
    for (const { id: organizationId } of await db.query('SELECT id FROM organizations ORDER BY id')) {
      const branches: { id: string; is_default: boolean }[] = await db.query(
        'SELECT id, is_default FROM organization_git_sync_branches WHERE organization_id = $1 ORDER BY id',
        [organizationId]
      );
      // As the services resolve it: none on a git-off workspace until the data phase adds one.
      const defaultBranchId = branches.find(({ is_default }) => is_default)?.id ?? null;
      const featureBranchIds = branches.filter(({ is_default }) => !is_default).map(({ id }) => id);
      const [{ id: environmentId }] = await db.query(
        'SELECT id FROM app_environments WHERE organization_id = $1 ORDER BY priority DESC LIMIT 1',
        [organizationId]
      );
      const read: Record<string, unknown> = {};

      // Workflows take a slug and leave the branches in the data phase; no 3.21.58 read finds them by either.
      for (const { id } of await db.query(
        `SELECT id FROM apps WHERE organization_id = $1 AND type <> 'workflow' ORDER BY id`,
        [organizationId]
      )) {
        const app = await apps.findOneById(id);
        const { name, slug } = app;
        read[`app ${id}`] = {
          name,
          slug,
          metadataVersion: (await versions.resolveMetadataVersion(db.manager, app))?.id,
          bySlug: slug && (await apps.findBySlug(slug, organizationId, defaultBranchId))?.id,
          byName: name && (await apps.findByAppName(name, organizationId, defaultBranchId))?.id,
          onFeatureBranches: await Promise.all(
            featureBranchIds.map(async (branchId) => (await apps.findOneById(id, branchId)).name)
          ),
        };
      }
      for (const { id } of await db.query('SELECT id FROM data_sources WHERE organization_id = $1 ORDER BY id', [
        organizationId,
      ])) {
        read[`default version of data source ${id}`] = (
          await DataSourcesRepository.findDefaultDsvForDataSource(db.manager, id, { activeOnly: true })
        )?.id;
      }
      read['global data sources'] = ids(await dataSources.allGlobalDS(admin, organizationId, { environmentId }));
      for (const branchId of featureBranchIds) {
        read[`global data sources on ${branchId}`] = ids(
          await dataSources.allGlobalDS(admin, organizationId, { environmentId, branchId })
        );
      }
      const folders: { id: string }[] = await db.query('SELECT id FROM folders WHERE organization_id = $1', [
        organizationId,
      ]);
      for (const [label, branchId] of [
        ['the default branch', defaultBranchId ?? undefined],
        ...featureBranchIds.map((id) => [id, id]),
      ]) {
        read[`folder apps on ${label}`] = ids(
          await folderApps.findFolderAppsForFolders(
            ids(folders),
            { isAllEditable: true } as UserAppsPermissions,
            db.manager,
            APP_TYPES.FRONT_END,
            undefined,
            branchId
          )
        );
      }
      reads[organizationId] = read;
    }
    return reads;
  } finally {
    await db.destroy();
  }
}

// --- Comparing two upgrade paths ---

const SCHEMA_QUERIES: Record<string, string> = {
  columns: `
    SELECT table_name || '.' || column_name || ' ' || udt_name || ' null=' || is_nullable
           || ' default=' || COALESCE(column_default, '') AS item
    FROM information_schema.columns WHERE table_schema = 'public'`,
  constraints: `
    SELECT c.conrelid::regclass || ' ' || c.conname || ' ' || pg_get_constraintdef(c.oid)
           || ' validated=' || c.convalidated AS item
    FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public'`,
  indexes: `SELECT indexdef AS item FROM pg_indexes WHERE schemaname = 'public'`,
  triggers: `
    SELECT pg_get_triggerdef(t.oid) || ' enabled=' || t.tgenabled::text AS item
    FROM pg_trigger t JOIN pg_class r ON r.oid = t.tgrelid JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal`,
  functions: `
    SELECT pg_get_functiondef(p.oid) AS item
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')`,
  enums: `
    SELECT t.typname || ' ' || string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS item
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid GROUP BY t.typname`,
  views: `SELECT viewname || ' ' || definition AS item FROM pg_views WHERE schemaname = 'public'`,
};

/** Columns, constraints, indexes, triggers, functions, enums and views, each as a sorted list. */
async function schemaOf(database: string): Promise<Record<string, string[]>> {
  return withScratchConnection(database, async (db) => {
    const schema: Record<string, string[]> = {};
    for (const [kind, sql] of Object.entries(SCHEMA_QUERIES)) {
      schema[kind] = ((await db.query(sql)) as { item: string }[]).map(({ item }) => item).sort();
    }
    return schema;
  });
}

const COLUMNS = `SELECT table_name || '.' || column_name AS column FROM information_schema.columns
                 WHERE table_schema = 'public'`;

/** `table.column` for every column both databases have. */
async function sharedColumns(...databases: string[]): Promise<Set<string>> {
  const [first, ...rest] = await Promise.all(
    databases.map((database) =>
      withScratchConnection(database, async (db) =>
        ((await db.query(COLUMNS)) as { column: string }[]).map(({ column }) => column)
      )
    )
  );
  return new Set(first.filter((column) => rest.every((columns) => columns.includes(column))));
}

/** Run bookkeeping, not data: ids follow how many sentinel rows each path toggled. */
const IGNORED_COLUMNS = new Set(['migrations.id', 'migration_baselines.last_migration_id']);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

/**
 * Every row of every table (or of `columns` only), as sorted JSON. Default branches get random ids, so branch ids
 * become `branch:<org>/<name>`; timestamps (now() at run time) become set or null; the lock sentinels, which only the
 * single-transaction path runs, are left out.
 */
async function rowsOf(database: string, columns?: Set<string>): Promise<Record<string, string[]>> {
  return withScratchConnection(database, async (db) => {
    const branches: { id: string; label: string }[] = await db.query(
      `SELECT id, 'branch:' || organization_id || '/' || branch_name AS label FROM organization_git_sync_branches`
    );
    const branchLabel = new Map(branches.map(({ id, label }) => [id, label]));
    const timestamps = new Set(
      (
        (await db.query(`${COLUMNS} AND (data_type LIKE 'timestamp%' OR data_type = 'date')`)) as { column: string }[]
      ).map(({ column }) => column)
    );
    const tables: { table_name: string }[] = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const rows: Record<string, string[]> = {};
    for (const { table_name } of tables) {
      const kept = (column: string) =>
        !IGNORED_COLUMNS.has(`${table_name}.${column}`) && (!columns || columns.has(`${table_name}.${column}`));
      if (columns && ![...columns].some((column) => column.startsWith(`${table_name}.`))) continue;
      const found: { row: Record<string, unknown> }[] = await db.query(
        `SELECT row_to_json(t) AS row FROM "${table_name}" t`
      );
      rows[table_name] = found
        .filter(({ row }) => !(table_name === 'migrations' && LOCK_SENTINEL_MIGRATION_NAMES.includes(String(row.name))))
        .map(({ row }) =>
          JSON.stringify(
            Object.keys(row)
              .filter(kept)
              .sort()
              .map((column) => [
                column,
                timestamps.has(`${table_name}.${column}`) ? (row[column] === null ? 'null' : 'set') : row[column],
              ])
          ).replace(UUID, (id) => branchLabel.get(id) ?? id)
        )
        .sort();
    }
    return rows;
  });
}

const FIXTURE_IDS = new Set(readFileSync(FIXTURE_SQL, 'utf8').match(UUID));

/**
 * Rows a migration inserts get gen_random_uuid() ids, different on each path. An id only one side has becomes
 * `new-uuid`, unless the snapshot has it: then a path dropped or re-created that row, and the difference shows.
 */
// ponytail: drops which new row a new id points at; label new rows by content if a mix-up ever matters.
function maskNewIds(...sides: Record<string, string[]>[]): Record<string, string[]>[] {
  const [first, ...rest] = sides.map((rows) => new Set(Object.values(rows).flat().join('\n').match(UUID)));
  const kept = (id: string) => FIXTURE_IDS.has(id) || rest.every((side) => side.has(id) && first.has(id));
  return sides.map((rows) =>
    Object.fromEntries(
      Object.entries(rows).map(([table, items]) => [
        table,
        items.map((item) => item.replace(UUID, (id) => (kept(id) ? id : 'new-uuid'))).sort(),
      ])
    )
  );
}

/** `items` minus `other`, counting duplicates (masked ids can make rows repeat). */
function minus(items: string[], other: string[]): string[] {
  const left = [...other];
  return items.filter((item) => {
    const at = left.indexOf(item);
    if (at === -1) return true;
    left.splice(at, 1);
    return false;
  });
}

/** Per kind or table: entries only one side has. Empty when both match. */
function difference(blocking: Record<string, string[]>, async: Record<string, string[]>) {
  const diff: Record<string, { onlyBlocking: string[]; onlyAsync: string[] }> = {};
  for (const key of new Set([...Object.keys(blocking), ...Object.keys(async)])) {
    const onlyBlocking = minus(blocking[key] ?? [], async[key] ?? []);
    const onlyAsync = minus(async[key] ?? [], blocking[key] ?? []);
    if (onlyBlocking.length || onlyAsync.length) diff[key] = { onlyBlocking, onlyAsync };
  }
  return diff;
}

// --- The data phase dropping and restoring old rules ---

// Fixture rows on the git-on workspace's default branch.
const DRAFT_GITON = 'ea3ea783-2dcd-455e-b5f8-4175ac817428';
const MORTGAGE_GITON_DRAFT = '4241f003-5ce9-4ba2-ace8-d83068d460f2';
const BUSINESS_ANALYTICS_ON_MAIN = '1f918690-5da5-4f91-aa15-cf3475b6fcd7';

/** A released version that keeps its branch: 3.21.58's chk_app_versions_branched_implies_draft refuses it. */
function releaseOnTheDefaultBranch(db: DataSource, versionId: string) {
  return db.query(`UPDATE app_versions SET status = 'PUBLISHED' WHERE id = $1`, [versionId]);
}

/** The 3.21.58 constraints and indexes the data phase drops for its backfill, as they stand now. */
function loosenedRules(database: string) {
  return withScratchConnection(database, (db) =>
    db.query(
      `SELECT conname AS name, pg_get_constraintdef(oid) || ' validated=' || convalidated AS definition
       FROM pg_constraint WHERE conname = ANY($1)
       UNION ALL
       SELECT indexname, indexdef FROM pg_indexes WHERE indexname = ANY($1)
       ORDER BY name`,
      [LEGACY_LOOSEN_RULES.map(({ name }) => name)]
    )
  );
}

/** Makes the data phase raise 'injected data failure' when it records the legacy upgrade marker. */
function failTheDataPhase(database: string) {
  return withScratchConnection(database, (db) =>
    db.query(`
      CREATE FUNCTION fail_legacy_backfill() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.name = '${LEGACY_BRANCH_MIGRATION}' THEN RAISE EXCEPTION 'injected data failure'; END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER fail_legacy_backfill BEFORE INSERT ON migrations
        FOR EACH ROW EXECUTE FUNCTION fail_legacy_backfill();`)
  );
}

// --- 3.21.58 pods still writing during and after the data phase ---

const PAUSE_LOCK = 3_21_58;
const OLD_POD_APP = 'ba5e0000-0000-4000-8000-00000000a001';

/**
 * Runs the data phase, holding it when it records `migration` until `write` is done. `write` gets its own
 * connection and commits before the data phase does, like a 3.21.58 pod would.
 */
async function runDataPhasePausedAfter(
  migration: string,
  database: string,
  write: (db: DataSource) => Promise<unknown>
): Promise<void> {
  await withScratchConnection(database, async (db) => {
    await db.query(`
      CREATE FUNCTION pause_data_phase() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.name = '${migration}' THEN PERFORM pg_advisory_xact_lock(${PAUSE_LOCK}); END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER pause_data_phase BEFORE INSERT ON migrations FOR EACH ROW EXECUTE FUNCTION pause_data_phase();`);
    const holder = db.createQueryRunner();
    await holder.connect();
    await holder.query('SELECT pg_advisory_lock($1)', [PAUSE_LOCK]);
    const dataPhase = runOk(database, 'data');
    try {
      await waitFor(
        'the data phase to pause',
        () =>
          db.query(
            `SELECT count(*)::int AS waiting FROM pg_locks WHERE locktype = 'advisory' AND objid = $1 AND NOT granted`,
            [PAUSE_LOCK]
          ),
        ([{ waiting }]) => waiting === 1,
        { timeoutMs: RUN_TIMEOUT_MS }
      );
      await write(db);
    } finally {
      await holder.query('SELECT pg_advisory_unlock($1)', [PAUSE_LOCK]);
      await holder.release();
    }
    await dataPhase;
    await db.query('DROP TRIGGER pause_data_phase ON migrations; DROP FUNCTION pause_data_phase()');
  });
}

/** What 3.21.58 writes for a new app on a git-off workspace: its draft has no branch. Copies the 'Draft gitoff' app. */
const OLD_POD_CREATES_AN_APP = `
  CREATE TEMP TABLE old_pod_app AS SELECT * FROM apps WHERE id = '7367e177-0da4-4f96-a526-a60cc9f1fc30';
  UPDATE old_pod_app SET id = '${OLD_POD_APP}', co_relation_id = gen_random_uuid(), created_at = now(), updated_at = now();
  INSERT INTO apps SELECT * FROM old_pod_app;
  CREATE TEMP TABLE old_pod_version AS SELECT * FROM app_versions WHERE id = '00e2fada-ac33-4f18-a3a7-0b517e61e413';
  UPDATE old_pod_version SET id = gen_random_uuid(), app_id = '${OLD_POD_APP}', co_relation_id = gen_random_uuid(),
    app_name = 'Written by old pod', slug = 'written-by-old-pod', created_at = now(), updated_at = now();
  INSERT INTO app_versions SELECT * FROM old_pod_version;
  DROP TABLE old_pod_app, old_pod_version;`;

/**
 * What 3.21.58 writes for a new data source (the no-branch is_default row, plus the default-branch row when git sync
 * is on) and for filing an app into a folder on a git-off workspace (no branch).
 */
const OLD_POD_CREATES_DATA_SOURCES_AND_FILES_THE_APP = `
  WITH sources AS (
    INSERT INTO data_sources (name, kind, organization_id, scope)
    VALUES ('written_by_old_pod', 'postgresql', '${GITOFF}', 'global'),
           ('written_by_old_pod', 'postgresql', '${GITON}', 'global')
    RETURNING id, organization_id
  )
  INSERT INTO data_source_versions (data_source_id, name, is_default, branch_id)
  SELECT s.id, 'written_by_old_pod', true, NULL FROM sources s
  UNION ALL
  SELECT s.id, 'written_by_old_pod', false, b.id
  FROM sources s JOIN organization_git_sync_branches b ON b.organization_id = s.organization_id AND b.is_default
  WHERE s.organization_id = '${GITON}';
  INSERT INTO folder_apps (folder_id, app_id) VALUES ('225c1d1d-496d-4d3c-a133-2c65a7a293d3', '${OLD_POD_APP}');`;

/** For each row an old pod wrote: its workspace, and whether its branch is now that workspace's default branch. */
function oldPodRowsOnDefaultBranch(database: string) {
  return withScratchConnection(database, (db) =>
    db.query(
      `SELECT 'app_versions' AS rows, o.name AS workspace, b.is_default AS on_default_branch
       FROM app_versions v JOIN apps a ON a.id = v.app_id JOIN organizations o ON o.id = a.organization_id
       JOIN organization_git_sync_branches b ON b.id = v.branch_id AND b.organization_id = o.id
       WHERE a.id = $1
       UNION ALL
       SELECT 'data_source_versions', o.name, b.is_default
       FROM data_source_versions v JOIN data_sources s ON s.id = v.data_source_id
       JOIN organizations o ON o.id = s.organization_id
       JOIN organization_git_sync_branches b ON b.id = v.branch_id AND b.organization_id = o.id
       WHERE s.name = 'written_by_old_pod'
       UNION ALL
       SELECT 'folder_apps', o.name, b.is_default
       FROM folder_apps fa JOIN folders f ON f.id = fa.folder_id JOIN organizations o ON o.id = f.organization_id
       JOIN organization_git_sync_branches b ON b.id = fa.branch_id AND b.organization_id = o.id
       WHERE fa.app_id = $1
       ORDER BY 1, 2`,
      [OLD_POD_APP]
    )
  );
}
