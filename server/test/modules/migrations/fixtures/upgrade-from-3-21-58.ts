/**
 * Database helpers for e2e/upgrade-from-3-21-58.spec.ts: restore the 3.21.58 snapshot, run the real
 * runner against it, and read back schema and rows to compare two upgrade paths.
 */
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LEGACY_LOOSEN_RULES, LEGACY_UPGRADE_MARKER } from 'src/migration-helpers/legacy-3-21-58-upgrade';
import { LOCK_SENTINEL_MIGRATION_NAMES } from 'src/migration-helpers/migration-locks';
import { MigrationPhase } from 'src/migration-helpers/migration-mode';
import { createScratchDatabase, postgres, SERVER_ROOT, withScratchConnection } from './harness';

const FIXTURE_SQL = join(__dirname, '3-21-58-database.sql');
const RUNNER = join(SERVER_ROOT, 'src/migration-helpers/run-all-migrations.ts');

export interface RunnerOutcome {
  exitCode: number | null;
  output: string;
}

/** A fresh scratch database holding the 3.21.58 snapshot. */
export async function restoreFixture(database: string): Promise<void> {
  await createScratchDatabase(database);
  await withScratchConnection(database, (db) => db.query(readFileSync(FIXTURE_SQL, 'utf8')));
}

/** The real runner with the real migrations. NODE_ENV=test would list no schema migrations (ormconfig.ts). */
export function runRunner(database: string, phase?: MigrationPhase): Promise<RunnerOutcome> {
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
    ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', RUNNER],
    { cwd: SERVER_ROOT, env }
  );
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  return new Promise((resolve) => child.on('close', (exitCode) => resolve({ exitCode, output })));
}

/** Runs the runner and throws unless it exits 0. Returns its output. */
export async function runOk(database: string, phase?: MigrationPhase): Promise<string> {
  const { exitCode, output } = await runRunner(database, phase);
  if (exitCode !== 0)
    throw new Error(`runner (${phase ?? 'single-transaction'}) exited ${exitCode}:\n${output.slice(-4000)}`);
  return output;
}

/** Dropping the baseline makes the next run count as the next release's first upgrade, so held-back cleanup runs. */
export const startNextRelease = (database: string) =>
  withScratchConnection(database, (db) => db.query('DELETE FROM migration_baselines'));

/** Whether the migrations table has a row for `name`. */
export const recorded = (database: string, name: string) =>
  withScratchConnection(
    database,
    async (db) => (await db.query('SELECT 1 FROM migrations WHERE name = $1', [name])).length > 0
  );

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
export async function schemaOf(database: string): Promise<Record<string, string[]>> {
  return withScratchConnection(database, async (db) => {
    const schema: Record<string, string[]> = {};
    for (const [kind, sql] of Object.entries(SCHEMA_QUERIES)) {
      schema[kind] = ((await db.query(sql)) as { item: string }[]).map(({ item }) => item).sort();
    }
    return schema;
  });
}

/** Run bookkeeping, not data: ids follow how many sentinel rows each path toggled. */
const IGNORED_COLUMNS = new Set(['migrations.id', 'migration_baselines.last_migration_id']);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

/**
 * Every row of every table, as sorted JSON. Default branches get random ids, so branch ids become
 * `branch:<org>/<name>`; timestamps (now() at run time) are left out, and so are the lock sentinels,
 * which only the single-transaction path runs.
 */
export async function rowsOf(database: string): Promise<Record<string, string[]>> {
  return withScratchConnection(database, async (db) => {
    const branches: { id: string; label: string }[] = await db.query(
      `SELECT id, 'branch:' || organization_id || '/' || branch_name AS label FROM organization_git_sync_branches`
    );
    const branchLabel = new Map(branches.map(({ id, label }) => [id, label]));
    const timestampColumns: { column: string }[] = await db.query(
      `SELECT table_name || '.' || column_name AS column FROM information_schema.columns
       WHERE table_schema = 'public' AND (data_type LIKE 'timestamp%' OR data_type = 'date')`
    );
    const skipped = new Set([...IGNORED_COLUMNS, ...timestampColumns.map(({ column }) => column)]);
    const tables: { table_name: string }[] = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const rows: Record<string, string[]> = {};
    for (const { table_name } of tables) {
      const found: { row: Record<string, unknown> }[] = await db.query(
        `SELECT row_to_json(t) AS row FROM "${table_name}" t`
      );
      rows[table_name] = found
        .filter(({ row }) => !(table_name === 'migrations' && LOCK_SENTINEL_MIGRATION_NAMES.includes(String(row.name))))
        .map(({ row }) =>
          JSON.stringify(
            Object.keys(row)
              .filter((column) => !skipped.has(`${table_name}.${column}`))
              .sort()
              .map((column) => [column, row[column]])
          ).replace(UUID, (id) => branchLabel.get(id) ?? id)
        )
        .sort();
    }
    return rows;
  });
}

const uuidsIn = (rows: Record<string, string[]>) => new Set(Object.values(rows).flat().join('\n').match(UUID));

/**
 * Rows a migration inserts get gen_random_uuid() ids, different on each path. An id only one side has
 * becomes `new-uuid`; fixture ids appear on both sides and stay.
 */
// ponytail: drops which new row a new id points at; label new rows by content if a mix-up ever matters.
export function maskNewIds(...sides: Record<string, string[]>[]): Record<string, string[]>[] {
  const [first, ...rest] = sides.map(uuidsIn);
  const shared = new Set([...first].filter((id) => rest.every((side) => side.has(id))));
  return sides.map((rows) =>
    Object.fromEntries(
      Object.entries(rows).map(([table, items]) => [
        table,
        items.map((item) => item.replace(UUID, (id) => (shared.has(id) ? id : 'new-uuid'))).sort(),
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
export function difference(blocking: Record<string, string[]>, async: Record<string, string[]>) {
  const diff: Record<string, { onlyBlocking: string[]; onlyAsync: string[] }> = {};
  for (const key of new Set([...Object.keys(blocking), ...Object.keys(async)])) {
    const onlyBlocking = minus(blocking[key] ?? [], async[key] ?? []);
    const onlyAsync = minus(async[key] ?? [], blocking[key] ?? []);
    if (onlyBlocking.length || onlyAsync.length) diff[key] = { onlyBlocking, onlyAsync };
  }
  return diff;
}

// --- The data phase dropping and restoring old rules ---

const LOOSENED_RULES_SQL = `
  SELECT conname AS name, pg_get_constraintdef(oid) || ' validated=' || convalidated AS definition
  FROM pg_constraint WHERE conname = ANY($1)
  UNION ALL
  SELECT indexname, indexdef FROM pg_indexes WHERE indexname = ANY($1)
  ORDER BY name`;

/** The 3.21.58 constraints and indexes the data phase drops for its backfill, as they stand now. */
export const loosenedRules = (database: string) =>
  withScratchConnection(database, (db) => db.query(LOOSENED_RULES_SQL, [LEGACY_LOOSEN_RULES.map(({ name }) => name)]));

/** Rules saved before a drop and not put back yet. */
export const rulesAwaitingRestore = (database: string) =>
  withScratchConnection(database, (db) => db.query('SELECT name FROM legacy_upgrade_dropped_rules'));

/** Makes the data phase raise 'injected data failure' when it records the legacy upgrade marker. */
export const failTheDataPhase = (database: string) =>
  withScratchConnection(database, (db) =>
    db.query(`
      CREATE FUNCTION fail_legacy_backfill() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.name = '${LEGACY_UPGRADE_MARKER}' THEN RAISE EXCEPTION 'injected data failure'; END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER fail_legacy_backfill BEFORE INSERT ON migrations
        FOR EACH ROW EXECUTE FUNCTION fail_legacy_backfill();`)
  );

// --- A 3.21.58 pod still writing after the data phase ---

/** What a 3.21.58 pod writes, with no branch: a new data source's is_default row, and an app filed into a folder. */
export const writeAsAnOldPod = (database: string) =>
  withScratchConnection(database, (db) =>
    db.query(`
      WITH source AS (
        INSERT INTO data_sources (name, kind, organization_id, scope)
        SELECT 'written_by_old_pod', 'postgresql', organization_id, 'global'
        FROM data_sources WHERE name = 'Sample data source' LIMIT 1
        RETURNING id
      )
      INSERT INTO data_source_versions (data_source_id, is_default, name)
      SELECT id, true, 'written_by_old_pod' FROM source;
      INSERT INTO folder_apps (folder_id, app_id)
      SELECT f.id, a.id FROM folders f JOIN apps a ON a.organization_id = f.organization_id
      WHERE NOT EXISTS (SELECT 1 FROM folder_apps fa WHERE fa.app_id = a.id)
      LIMIT 1;`)
  );

/** How many data_source_versions and folder_apps rows have no branch. */
export const branchlessRowCounts = (database: string) =>
  withScratchConnection(database, (db) =>
    db.query(`SELECT (SELECT count(*) FROM data_source_versions WHERE branch_id IS NULL)::int AS versions,
                     (SELECT count(*) FROM folder_apps WHERE branch_id IS NULL)::int AS folder_apps`)
  );

/** For each row `writeAsAnOldPod` wrote: whether its branch is now the default branch. */
export const oldPodRowsOnDefaultBranch = (database: string) =>
  withScratchConnection(database, (db) =>
    db.query(`
      SELECT 'data_source_versions' AS rows, b.is_default AS on_default_branch
      FROM data_source_versions v JOIN data_sources s ON s.id = v.data_source_id
      JOIN organization_git_sync_branches b ON b.id = v.branch_id AND b.organization_id = s.organization_id
      WHERE s.name = 'written_by_old_pod'
      UNION ALL
      SELECT 'folder_apps', b.is_default
      FROM folder_apps fa JOIN folders f ON f.id = fa.folder_id
      JOIN organization_git_sync_branches b ON b.id = fa.branch_id AND b.organization_id = f.organization_id
      WHERE fa.created_at = (SELECT max(created_at) FROM folder_apps)
      ORDER BY 1`)
  );
