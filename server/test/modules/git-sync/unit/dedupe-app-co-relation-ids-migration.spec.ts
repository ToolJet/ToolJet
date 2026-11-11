/**
 * DedupeAppCoRelationIds1793400000000 — the detached duplicate is renamed exactly once.
 *
 * Reported after the first run against real data: an app detached by the dedup came out named
 * "X (duplicate …) (duplicate …)" when it held drafts on more than one branch.
 *
 * Mechanism, read from the migration and the trigger it fires:
 *   - the rename used to concatenate onto the row's CURRENT app_name;
 *   - renaming one draft fires `propagate_app_version_metadata` (migrations/data/1781741000000),
 *     which copies that draft's app_name and slug onto the app's other non-stub version rows —
 *     on every branch, the second draft included;
 *   - the loop then reached that second draft, read back its already-suffixed name, and
 *     suffixed it again.
 *
 * The migration now computes the name once per app and writes it as a literal, and rewrites only
 * the organization's default branch: on a non-default branch
 * `enforce_app_versions_app_name_branch_unique` counts the app's OWN sibling rows as a
 * collision, so a write there would abort the upgrade. The other branches still receive the
 * name, from the propagation above.
 *
 * The second case pins the NULL-status hole found while writing the first: `app_versions.status`
 * is nullable with no default, and the trigger's PL/pgSQL guard does not take its branch on a
 * NULL — so such a row IS one the trigger acts on, and a predicate written with `NOT (status =
 * 'DRAFT' AND …)` put it in neither of the migration's two sets and left it named as it was.
 * Legacy rows are exactly the population this migration exists for.
 *
 * Driven through `up(queryRunner)` the way the CLI invokes it, inside a transaction that is
 * rolled back — the duplicate state this needs cannot exist while the migration's own unique
 * index does, so the index is dropped and the rollback puts it back.
 *
 * @group gitsync
 */
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  initTestApp,
} from 'test-helper';
import { App } from 'src/entities/app.entity';
import { DedupeAppCoRelationIds1793400000000 } from '@migrations/data/1793400000000-DedupeAppCoRelationIds';

jest.setTimeout(60_000);

const SUFFIX = '(duplicate ';
const suffixCount = (name: string) => name.split(SUFFIX).length - 1;

interface LoserRow {
  app_name: string;
  slug: string;
  is_synced: boolean;
  branch_id: string;
}

describe('DedupeAppCoRelationIds1793400000000', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  /**
   * Two apps of one type in one workspace sharing a git identity, the loser holding a version
   * row on the default branch and one on a second branch. Everything that makes the pair a
   * duplicate happens inside `run`'s transaction, because the migration's unique index — present
   * in a migrated database — forbids the state outside it.
   */
  const withDuplicatePair = async (
    status: 'DRAFT' | null,
    includeFeatureBranch: boolean,
    assertions: (ctx: {
      queryRunner: QueryRunner;
      keeperId: string;
      loserId: string;
      sharedIdentity: string;
      featureBranchId: string | null;
      loserRows: LoserRow[];
    }) => Promise<void>
  ) => {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const admin = await createAdmin(nestApp, `dedupe-co-relation-${stamp}@tooljet.io`);
    const organizationId = admin.user.organizationId;

    const keeper = await createApplication(nestApp, { name: `dedupe-keeper-${stamp}`, user: admin.user });
    const loser = await createApplication(nestApp, { name: `dedupe-loser-${stamp}`, user: admin.user });
    const keeperVersion = await createApplicationVersion(nestApp, keeper as App & { organizationId: string });
    const loserVersion = await createApplicationVersion(nestApp, loser as App & { organizationId: string });

    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Copies a version row through jsonb so every NOT NULL column comes along, whatever the
      // current schema holds; the overrides are column names.
      const cloneVersion = async (sourceId: string, overrides: Record<string, unknown>) =>
        queryRunner.query(
          `INSERT INTO app_versions
           SELECT (jsonb_populate_record(NULL::app_versions,
                     to_jsonb(av) || $2::jsonb || jsonb_build_object('id', gen_random_uuid()::text))).*
           FROM app_versions av WHERE av.id = $1`,
          [sourceId, JSON.stringify(overrides)]
        );

      // createApplicationVersion leaves status NULL; production always writes DRAFT
      // (versions/repository.ts:50). The reported case is two canonical DRAFTs.
      if (status) {
        await queryRunner.query(`UPDATE app_versions SET status = $1 WHERE app_id = $2 OR app_id = $3`, [
          status,
          keeper.id,
          loser.id,
        ]);
      }

      // The duplicate state predates the index, so it cannot be created while the index is there.
      await queryRunner.query(`DROP INDEX IF EXISTS "idx_apps_org_type_co_relation_id_unique"`);
      const sharedIdentity = randomUUID();
      await queryRunner.query(`UPDATE apps SET co_relation_id = $1 WHERE id = $2 OR id = $3`, [
        sharedIdentity,
        keeper.id,
        loser.id,
      ]);

      // The keeper has to win the ranking on content: non_stub_versions first.
      await cloneVersion(keeperVersion.id, { name: `kept-v2-${stamp}`, status: 'PUBLISHED' });
      await cloneVersion(keeperVersion.id, { name: `kept-v3-${stamp}`, status: 'PUBLISHED' });
      await cloneVersion(keeperVersion.id, { name: `kept-v4-${stamp}`, status: 'PUBLISHED' });

      // The reported shape: a second version row of the same app, on a second branch. Left out
      // for the NULL-status case, which has to stay on the default branch — the second rename
      // pass would otherwise reach the feature row, and its propagation would repair the
      // default-branch rows behind the predicate under test.
      let featureBranchId: string | null = null;
      if (includeFeatureBranch) {
        [{ id: featureBranchId }] = await queryRunner.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, false) RETURNING id`,
          [organizationId, `feature-${stamp}`]
        );
        await cloneVersion(loserVersion.id, { name: `loser-feature-${stamp}`, branch_id: featureBranchId });
      }

      // And a SECOND propagating row on the default branch, which is where the rename can still
      // read back its own output: an unsynced app is exempt from the single-draft index
      // (1782100000000), so this is reachable even after the rename stopped crossing branches.
      await cloneVersion(loserVersion.id, { name: `loser-main-2-${stamp}` });

      // Mark everything synced, last: a duplicate identity only exists on apps git has pushed,
      // and `is_synced = false` is what keeps a detached copy alive through the next pull. The
      // second default-branch draft stays unsynced because that is the only state in which the
      // single-draft index (1782100000000) permits it.
      await queryRunner.query(
        `UPDATE app_versions SET is_synced = true WHERE (app_id = $1 OR app_id = $2) AND name <> $3`,
        [keeper.id, loser.id, `loser-main-2-${stamp}`]
      );

      const migration = new DedupeAppCoRelationIds1793400000000();
      await migration.up(queryRunner);
      await migration.beforeCommit(queryRunner);

      const loserRows: LoserRow[] = await queryRunner.query(
        `SELECT app_name, slug, is_synced, branch_id FROM app_versions WHERE app_id = $1`,
        [loser.id]
      );

      await assertions({
        queryRunner,
        keeperId: keeper.id,
        loserId: loser.id,
        sharedIdentity,
        featureBranchId,
        loserRows,
      });
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  };

  it('suffixes a duplicate holding drafts on two branches once, and leaves the keeper alone', async () => {
    await withDuplicatePair(
      'DRAFT',
      true,
      async ({ queryRunner, keeperId, loserId, sharedIdentity, featureBranchId, loserRows }) => {
        expect(loserRows).toHaveLength(3);
        for (const row of loserRows) {
          expect(suffixCount(row.app_name)).toBe(1);
          expect(row.is_synced).toBe(false);
        }
        // One name for the whole app, default branch and feature branch alike — the
        // feature-branch row is never written by the migration, it takes the name from the
        // propagation trigger.
        expect(new Set(loserRows.map((row) => row.app_name)).size).toBe(1);
        expect(loserRows.some((row) => row.branch_id === featureBranchId)).toBe(true);

        const defaultBranchRow = loserRows.find((row) => row.branch_id !== featureBranchId);
        expect(defaultBranchRow.slug).toBe(loserId);

        const [{ co_relation_id: loserIdentity }] = await queryRunner.query(
          `SELECT co_relation_id FROM apps WHERE id = $1`,
          [loserId]
        );
        const [{ co_relation_id: keeperIdentity }] = await queryRunner.query(
          `SELECT co_relation_id FROM apps WHERE id = $1`,
          [keeperId]
        );
        expect(keeperIdentity).toBe(sharedIdentity);
        expect(loserIdentity).not.toBe(sharedIdentity);

        // The kept app is not touched at all.
        const keeperRows: { app_name: string }[] = await queryRunner.query(
          `SELECT app_name FROM app_versions WHERE app_id = $1`,
          [keeperId]
        );
        expect(new Set(keeperRows.map((row) => row.app_name)).size).toBe(1);
        expect(keeperRows[0].app_name).not.toContain(SUFFIX);

        const index = await queryRunner.query(
          `SELECT 1 FROM pg_indexes WHERE indexname = 'idx_apps_org_type_co_relation_id_unique'`
        );
        expect(index).toHaveLength(1);
      }
    );
  });

  it('clears the keeper name and slug off every branch, so a default-branch pull can still write', async () => {
    // The failure this guards: enforce_app_versions_default_branch_slug_unique is instance-wide
    // with NO branch filter, so a slug the detached copy still holds on a feature branch
    // collides with the KEPT app's write on the default branch. Pull's pre-flight
    // (resolveNonCollidingSlug) filters is_default = true and misses it; its SAVEPOINT recovery
    // then retries with a UUID slug, and propagate_app_version_metadata carries that into the
    // kept app's own feature-branch row, where the name trigger raises
    // app_versions_app_name_branch_id_unique — not a slug error, so the recovery rethrows and
    // the pull aborts. Both writes are exercised below.
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const admin = await createAdmin(nestApp, `dedupe-branch-leak-${stamp}@tooljet.io`);
    const organizationId = admin.user.organizationId;

    const keeper = await createApplication(nestApp, { name: `leak-keeper-${stamp}`, user: admin.user });
    const loser = await createApplication(nestApp, { name: `leak-loser-${stamp}`, user: admin.user });
    const keeperVersion = await createApplicationVersion(nestApp, keeper as App & { organizationId: string });
    const loserVersion = await createApplicationVersion(nestApp, loser as App & { organizationId: string });

    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const cloneVersion = async (sourceId: string, overrides: Record<string, unknown>) =>
        queryRunner.query(
          `INSERT INTO app_versions
           SELECT (jsonb_populate_record(NULL::app_versions,
                     to_jsonb(av) || $2::jsonb || jsonb_build_object('id', gen_random_uuid()::text))).*
           FROM app_versions av WHERE av.id = $1`,
          [sourceId, JSON.stringify(overrides)]
        );

      await queryRunner.query(`DROP INDEX IF EXISTS "idx_apps_org_type_co_relation_id_unique"`);

      // Two apps holding one name and one slug predates the uniqueness triggers and cannot be
      // produced through them — every write that would create it is exactly what they reject.
      // Seeded with them off, then switched back on so the migration faces the real ones.
      await queryRunner.query(`ALTER TABLE app_versions DISABLE TRIGGER USER`);

      const sharedIdentity = randomUUID();
      const sharedName = `leak-shared-${stamp}`;
      const sharedSlug = `leak-shared-slug-${stamp}`;
      await queryRunner.query(`UPDATE apps SET co_relation_id = $1 WHERE id = $2 OR id = $3`, [
        sharedIdentity,
        keeper.id,
        loser.id,
      ]);
      await queryRunner.query(
        `UPDATE app_versions SET app_name = $1, slug = $2, status = 'DRAFT', is_synced = true
         WHERE app_id = $3 OR app_id = $4`,
        [sharedName, sharedSlug, keeper.id, loser.id]
      );

      await cloneVersion(keeperVersion.id, { name: `leak-kept-v2-${stamp}`, status: 'PUBLISHED' });
      await cloneVersion(keeperVersion.id, { name: `leak-kept-v3-${stamp}`, status: 'PUBLISHED' });
      await cloneVersion(keeperVersion.id, { name: `leak-kept-v4-${stamp}`, status: 'PUBLISHED' });

      const [{ id: featureBranchId }] = await queryRunner.query(
        `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
         VALUES ($1, $2, false) RETURNING id`,
        [organizationId, `feature-${stamp}`]
      );
      // The kept app's own row on that branch — what the propagation cascade writes into.
      await cloneVersion(keeperVersion.id, { name: `leak-keeper-feature-${stamp}`, branch_id: featureBranchId });
      // And the detached copy's own rows on that branch: a non-stub, plus the pull-created STUB
      // that propagate_app_version_metadata skips. Both on one non-default branch, which
      // fetchLatestVersionsForBranch explicitly allows and where the name trigger has no
      // same-app exemption — so the two cannot come out of the migration sharing a name.
      await cloneVersion(loserVersion.id, {
        name: `leak-loser-feature-${stamp}`,
        branch_id: featureBranchId,
      });
      await cloneVersion(loserVersion.id, {
        name: `leak-loser-feature-stub-${stamp}`,
        branch_id: featureBranchId,
        is_stub: true,
      });

      await queryRunner.query(`ALTER TABLE app_versions ENABLE TRIGGER USER`);

      const migration = new DedupeAppCoRelationIds1793400000000();
      await migration.up(queryRunner);
      await migration.beforeCommit(queryRunner);

      // Nothing of the detached copy still carries the kept app's identity, on any branch.
      const loserRows: { app_name: string; slug: string; is_stub: boolean; branch_id: string }[] =
        await queryRunner.query(`SELECT app_name, slug, is_stub, branch_id FROM app_versions WHERE app_id = $1`, [
          loser.id,
        ]);
      expect(loserRows).toHaveLength(3);
      expect(loserRows.some((row) => row.is_stub)).toBe(true);
      for (const row of loserRows) {
        expect(row.app_name).not.toBe(sharedName);
        expect(row.slug).toBe(loser.id);
        expect(suffixCount(row.app_name)).toBe(1);
      }

      // The two rows sharing the feature branch carry distinct names; the extra one is the
      // detached name plus its own version id.
      const featureRows = loserRows.filter((row) => row.branch_id === featureBranchId);
      expect(featureRows).toHaveLength(2);
      expect(new Set(featureRows.map((row) => row.app_name)).size).toBe(2);

      // The two pull writes. Awaited directly rather than wrapped in expect().resolves so a
      // regression reports the PostgreSQL error itself.
      await queryRunner.query(`UPDATE app_versions SET slug = $1, app_name = $2, is_synced = true WHERE id = $3`, [
        sharedSlug,
        sharedName,
        keeperVersion.id,
      ]);
      await queryRunner.query(`UPDATE app_versions SET slug = $1, app_name = $2, is_synced = true WHERE id = $3`, [
        randomUUID(),
        sharedName,
        keeperVersion.id,
      ]);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });

  it('renames a legacy duplicate whose version rows carry no status', async () => {
    await withDuplicatePair(null, false, async ({ loserId, loserRows }) => {
      expect(loserRows).toHaveLength(2);
      for (const row of loserRows) {
        expect(suffixCount(row.app_name)).toBe(1);
        expect(row.is_synced).toBe(false);
      }
      expect(loserRows.map((row) => row.slug)).toContain(loserId);
    });
  });
});
