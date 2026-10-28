import { DataSource, QueryRunner } from 'typeorm';
import { BackfillMigration } from './migration-mode';
import { withShortLock } from './with-short-lock';

/**
 * Async upgrade of a 3.21.58 database. Its backfill would break a few old rules, and the original migrations drop
 * them inside the backfill transaction, holding ACCESS EXCLUSIVE to the end. Instead: drop them first, each in its
 * own short transaction (loosen); run lock-free variants; on failure add them back (restore), so 3.21.58 runs again.
 * Delete this module when upgrades from 3.21.58 are no longer supported.
 */
export const LEGACY_UPGRADE_MARKER = 'MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000';

export interface LooseRule {
  name: string;
  kind: 'check' | 'index';
  table: string;
}

/** Each one the backfill breaks (spike on seeded 3.21.58 data); `default_must_be_active_check` holds, so it stays. */
export const LEGACY_LOOSEN_RULES: readonly LooseRule[] = [
  { name: 'data_source_versions_default_branch_null_check', kind: 'check', table: 'data_source_versions' },
  { name: 'idx_unique_active_name_branch', kind: 'index', table: 'data_source_versions' },
  { name: 'chk_app_versions_branched_implies_draft', kind: 'check', table: 'app_versions' },
  { name: 'app_versions_app_default_branch_draft_unique', kind: 'index', table: 'app_versions' },
  { name: 'app_versions_app_default_branch_draft_unique_ensure_single_stub', kind: 'index', table: 'app_versions' },
];

export interface SavedRule {
  name: string;
  kind: 'check' | 'index';
  table_name: string;
  definition: string;
}

const DROPPED_RULES_DDL = `
  CREATE TABLE IF NOT EXISTS legacy_upgrade_dropped_rules (
    name text PRIMARY KEY,
    kind text NOT NULL,
    table_name text NOT NULL,
    definition text NOT NULL,
    dropped_at timestamptz NOT NULL DEFAULT now()
  )`;

export const legacyUpgradePending = (pendingNames: readonly string[]): boolean =>
  pendingNames.includes(LEGACY_UPGRADE_MARKER);

/** Saves the definition (first save wins, so a rerun never overwrites the original) and drops the rule. */
export function loosenStep({ name, kind, table }: LooseRule): string[] {
  const save =
    kind === 'check'
      ? `SELECT conname, 'check', '${table}', pg_get_constraintdef(oid) FROM pg_constraint
         WHERE conname = '${name}' AND conrelid = '${table}'::regclass`
      : `SELECT indexname, 'index', tablename, indexdef FROM pg_indexes
         WHERE schemaname = current_schema() AND indexname = '${name}'`;
  return [
    `INSERT INTO legacy_upgrade_dropped_rules (name, kind, table_name, definition) ${save} ON CONFLICT (name) DO NOTHING`,
    kind === 'check' ? `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${name}` : `DROP INDEX IF EXISTS ${name}`,
  ];
}

/** Steps that add a saved rule back. A CHECK goes in NOT VALID first, so it enforces new rows at once. */
export function restoreSteps({ name, kind, table_name, definition }: SavedRule): string[][] {
  if (kind === 'index') return [[definition.replace(/^CREATE (UNIQUE )?INDEX /i, 'CREATE $1INDEX IF NOT EXISTS ')]];
  const check = definition.replace(/\s+NOT VALID$/i, '');
  return [
    [`ALTER TABLE ${table_name} DROP CONSTRAINT IF EXISTS ${name}, ADD CONSTRAINT ${name} ${check} NOT VALID`],
    [`ALTER TABLE ${table_name} VALIDATE CONSTRAINT ${name}`],
  ];
}

export async function loosenLegacyRules(dataSource: DataSource): Promise<void> {
  await dataSource.query(DROPPED_RULES_DDL);
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    for (const rule of LEGACY_LOOSEN_RULES) await withShortLock(queryRunner, loosenStep(rule));
    console.log(
      `[migrations] Legacy upgrade: dropped ${LEGACY_LOOSEN_RULES.length} old rules the backfill would break.`
    );
  } finally {
    await queryRunner.release();
  }
}

/**
 * Adds every saved rule back. Refused once the backfill committed: the rules no longer fit the data. A rule that
 * no longer validates (3.21.58 pods wrote rows without it) stays NOT VALID, still enforcing new rows, and is reported.
 */
export async function restoreLegacyRules(dataSource: DataSource): Promise<string[]> {
  const [{ table }] = await dataSource.query(`SELECT to_regclass('legacy_upgrade_dropped_rules') AS table`);
  if (!table) return [];
  const [committed] = await dataSource.query('SELECT 1 FROM migrations WHERE name = $1', [LEGACY_UPGRADE_MARKER]);
  if (committed) {
    throw new Error(
      'The legacy backfill has committed; its old rules no longer fit the data, so they are not restored.'
    );
  }
  const saved: SavedRule[] = await dataSource.query(
    'SELECT name, kind, table_name, definition FROM legacy_upgrade_dropped_rules'
  );
  const problems: string[] = [];
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    for (const rule of saved) {
      try {
        for (const step of restoreSteps(rule)) await withShortLock(queryRunner, step);
        await queryRunner.query('DELETE FROM legacy_upgrade_dropped_rules WHERE name = $1', [rule.name]);
      } catch (error) {
        problems.push(`${rule.name}: ${(error as Error).message}`);
      }
    }
  } finally {
    await queryRunner.release();
  }
  console.log(
    `[migrations] Legacy upgrade: restored ${saved.length - problems.length} of ${saved.length} old rules.` +
      (problems.length ? ` Not restored: ${problems.join('; ')}` : '')
  );
  return problems;
}

type MigrationStep = (queryRunner: QueryRunner) => Promise<void>;

const run =
  (...statements: string[]): MigrationStep =>
  async (queryRunner) => {
    for (const sql of statements) await queryRunner.query(sql);
  };

/** Lock-free replacements, by class name: row changes in up(), index builds in tail(), removals in contract. */
export const LEGACY_VARIANTS: ReadonlyMap<string, { up: MigrationStep; tail?: MigrationStep }> = new Map([
  [
    'MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000',
    {
      // The original's row changes, verbatim; its drops and NOT NULL move to contract.
      up: run(
        'SET LOCAL statement_timeout = 0',
        'UPDATE data_source_versions SET is_synced = true WHERE branch_id IS NOT NULL',
        `UPDATE data_source_versions f
         SET branch_id = wb.id
         FROM data_sources ds
         JOIN organization_git_sync_branches wb
           ON wb.organization_id = ds.organization_id AND wb.is_default = true
         WHERE f.data_source_id = ds.id
           AND f.is_active = true
           AND f.branch_id IS NULL
           AND (SELECT count(*) FROM data_source_versions d WHERE d.data_source_id = f.data_source_id) = 1`,
        `DELETE FROM data_source_versions f
         WHERE f.is_active = true
           AND f.branch_id IS NULL
           AND EXISTS (
             SELECT 1 FROM data_source_versions d
             WHERE d.data_source_id = f.data_source_id AND d.branch_id IS NOT NULL
           )`
      ),
      // Final shape (MakeDataSourceVersionNameCaseSensitive); loosen dropped the old index of this name.
      tail: run(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_name_branch
           ON data_source_versions (name, branch_id) WHERE is_active = true`
      ),
    },
  ],
  // The tail above already builds the case-sensitive index.
  ['MakeDataSourceVersionNameCaseSensitive1785500000000', { up: async () => undefined }],
]);

/** Swaps in the variants. Call before announcing or collecting tails, which wrap up() and read tail(). */
export function useLegacyVariants(dataDS: DataSource): void {
  for (const migration of dataDS.migrations as BackfillMigration[]) {
    const variant = LEGACY_VARIANTS.get(migration.name || migration.constructor.name);
    if (!variant) continue;
    migration.up = variant.up;
    migration.tail = variant.tail;
  }
}
