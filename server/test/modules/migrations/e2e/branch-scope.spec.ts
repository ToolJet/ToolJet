/** @group database */
import { DataSource } from 'typeorm';
import { appVersionOnBranch, nullBranchLast } from 'src/helpers/branch_scope.helper';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';

const DEFAULT = '00000000-0000-0000-0000-00000000000d';
const FEATURE = '00000000-0000-0000-0000-00000000000f';

/** 3.21.58 rows have no branch until the backfill; reads must still find them on the default branch. */
describe('helpers/branch_scope | 3.21.58 rows with no branch', () => {
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
        ('on-default', 'app', '${DEFAULT}'),
        ('on-feature', 'app', '${FEATURE}'),
        ('legacy', 'app', NULL),
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
    ['no default branch yet (git off)', null, ['legacy']],
  ])('should match the rows 3.21.58 showed on %s', async (_on, branchId, expected) => {
    expect(await versionsOn(branchId)).toEqual(expected);
  });

  it('should prefer the backfilled row over its no-branch twin', async () => {
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
