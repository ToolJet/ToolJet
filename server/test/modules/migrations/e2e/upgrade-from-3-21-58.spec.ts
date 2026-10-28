/**
 * Covers: migration-helpers/legacy-3-21-58-upgrade.ts, run-all-migrations.ts, helpers/branch_scope.helper.ts
 * @group database
 */
import { DataSource } from 'typeorm';
import { appVersionOnBranch, nullBranchLast } from 'src/helpers/branch_scope.helper';
import { LEGACY_LOOSEN_RULES, LEGACY_BRANCH_MIGRATION } from 'src/migration-helpers/legacy-3-21-58-upgrade';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';
import {
  branchlessRowCounts,
  difference,
  failTheDataPhase,
  loosenedRules,
  maskNewIds,
  oldPodRowsOnDefaultBranch,
  recorded,
  restoreFixture,
  rowsOf,
  rulesAwaitingRestore,
  runOk,
  runRunner,
  schemaOf,
  startNextRelease,
  writeAsAnOldPod,
} from '../fixtures/upgrade-from-3-21-58';

/**
 * Blocking mode runs every migration in one transaction before the server starts. Async mode runs schema,
 * then data (with the 3.21.58 stand-ins), then cleanup. From a 3.21.58 snapshot, both must end in the same place.
 * Delete with legacy-3-21-58-upgrade.ts when 3.21.58 upgrades are no longer supported.
 */

const CLEANUP_MIGRATION = 'CleanupLegacyBranchModel1793300000000';
const RUN_TIMEOUT_MS = 10 * 60_000;

const blockingDatabase = `tooljet_legacy_blocking_${process.pid}`;
const asyncDatabase = `tooljet_legacy_async_${process.pid}`;
const failingDatabase = `tooljet_legacy_failing_${process.pid}`;
const lateWritesDatabase = `tooljet_legacy_late_writes_${process.pid}`;

describe('Upgrading a 3.21.58 database', () => {
  let asyncFirstUpgrade: FirstAsyncUpgrade;

  beforeAll(async () => {
    await Promise.all([blockingDatabase, asyncDatabase].map(restoreFixture));
    [, asyncFirstUpgrade] = await Promise.all([
      upgradeTwiceInBlockingMode(blockingDatabase),
      upgradeTwiceInAsyncMode(asyncDatabase),
    ]);
  }, RUN_TIMEOUT_MS);

  afterAll(async () => {
    await Promise.all([blockingDatabase, asyncDatabase, failingDatabase, lateWritesDatabase].map(dropScratchDatabase));
  });

  it('should hold the cleanup back on the first upgrade, because the release it waits for is installed by that same upgrade', () => {
    expect(asyncFirstUpgrade.cleanupOutput).toContain(`Holding back ${CLEANUP_MIGRATION}`);
    expect(asyncFirstUpgrade.cleanupApplied).toBe(false);
  });

  it('should apply the cleanup on the next upgrade, in both blocking and async mode', async () => {
    expect(await recorded(blockingDatabase, CLEANUP_MIGRATION)).toBe(true);
    expect(await recorded(asyncDatabase, CLEANUP_MIGRATION)).toBe(true);
  });

  it('should end with the same tables, columns, indexes and functions as a single-transaction upgrade', async () => {
    const [blocking, async] = await Promise.all([schemaOf(blockingDatabase), schemaOf(asyncDatabase)]);

    expect(difference(blocking, async)).toEqual({});
  });

  it('should end with the same rows as a single-transaction upgrade', async () => {
    const [blocking, async] = maskNewIds(...(await Promise.all([rowsOf(blockingDatabase), rowsOf(asyncDatabase)])));

    expect(difference(blocking, async)).toEqual({});
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
      expect(await recorded(failingDatabase, LEGACY_BRANCH_MIGRATION)).toBe(false);
      expect(await rulesAwaitingRestore(failingDatabase)).toEqual([]);
    },
    RUN_TIMEOUT_MS
  );

  it(
    'should move rows an old 3.21.58 server writes after the data phase onto the default branch during cleanup',
    async () => {
      await restoreFixture(lateWritesDatabase);
      await runOk(lateWritesDatabase, 'schema');
      await runOk(lateWritesDatabase, 'data');
      await writeAsAnOldPod(lateWritesDatabase);
      expect(await branchlessRowCounts(lateWritesDatabase)).toEqual([{ versions: 1, folder_apps: 1 }]);
      await startNextRelease(lateWritesDatabase);

      await runOk(lateWritesDatabase, 'cleanup');

      expect(await recorded(lateWritesDatabase, CLEANUP_MIGRATION)).toBe(true);
      expect(await oldPodRowsOnDefaultBranch(lateWritesDatabase)).toEqual([
        { rows: 'data_source_versions', on_default_branch: true },
        { rows: 'folder_apps', on_default_branch: true },
      ]);
    },
    RUN_TIMEOUT_MS
  );
});

interface FirstAsyncUpgrade {
  cleanupOutput: string;
  cleanupApplied: boolean;
}

/** Blocking mode: the first upgrade runs everything in one transaction, cleanup held back; the second applies it. */
async function upgradeTwiceInBlockingMode(database: string): Promise<void> {
  await runOk(database);

  await startNextRelease(database);
  await runOk(database);
}

/** Async mode: the first upgrade runs schema, data, cleanup (cleanup held back); the second applies the cleanup. */
async function upgradeTwiceInAsyncMode(database: string): Promise<FirstAsyncUpgrade> {
  await runOk(database, 'schema');
  await runOk(database, 'data');
  const cleanupOutput = await runOk(database, 'cleanup');
  const cleanupApplied = await recorded(database, CLEANUP_MIGRATION);

  await startNextRelease(database);
  await runOk(database, 'cleanup');
  return { cleanupOutput, cleanupApplied };
}

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

  const versionsOn = async (branchId: string | null): Promise<string[]> =>
    (
      await db
        .createQueryBuilder()
        .select('av.id', 'id')
        .from('app_versions', 'av')
        .where(appVersionOnBranch('av', 'branchId'), { branchId })
        .orderBy('av.id')
        .getRawMany()
    ).map(({ id }) => id);

  it.each([
    ['the default branch', DEFAULT, ['legacy', 'on-default']],
    ['a feature branch', FEATURE, ['on-feature']],
    ['a workspace with git sync off (no default branch yet)', null, ['legacy']],
  ])('should show the same app versions 3.21.58 showed for %s', async (_on, branchId, expected) => {
    expect(await versionsOn(branchId)).toEqual(expected);
  });

  it('should list the copy that has a branch before its old copy with no branch', async () => {
    const [first] = await db
      .createQueryBuilder()
      .select('av.id', 'id')
      .from('app_versions', 'av')
      .where(appVersionOnBranch('av', 'branchId'), { branchId: DEFAULT })
      .orderBy(nullBranchLast('av.branch_id'), 'ASC')
      .getRawMany();

    expect(first).toEqual({ id: 'on-default' });
  });
});
