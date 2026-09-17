import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPublishedVersionMetadataFromDraft1781740850000 implements MigrationInterface {
  // One-time data fix: copy the four user-facing metadata fields
  // (app_name / slug / icon / is_public) from each app's canonical DRAFT
  // version_type='version' row onto that app's PUBLISHED version_type='version'
  // rows. The DRAFT row is the single source of truth (the same model the
  // propagate_app_version_metadata / sync_published_app_version_metadata_from_draft
  // triggers enforce GOING FORWARD); this realigns snapshots that drifted before
  // those triggers existed.
  //
  // Ordering: runs right after EnsureDefaultBranchForAllOrganizations
  // (1781740800000) and BEFORE MakeAppVersionBranchIdNotNullAndGitSyncFlags
  // (1781741000000) — i.e. before the metadata-sync triggers are installed — so the
  // bulk UPDATE does not fire those triggers row by row.
  //
  // Because it runs before that migration, branch_id is NOT yet backfilled onto the
  // default branch (git-sync-off rows are still branchless), so we do NOT scope by
  // the default branch. Instead we match the app's main-line versions by
  // version_type='version' — these live on the default branch when git-sync is on
  // and are branchless when it is off — which mirrors the propagate trigger's own
  // app-wide, version_type='version' scope and covers both states.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Canonical DRAFT per app: the non-stub DRAFT version_type='version' row. If more
    // than one exists (git-sync-off can have several), pick the most recently updated
    // (is_synced is not backfilled at this point, so updated_at is the tiebreaker —
    // matching the sync trigger's selection once flags are uniform). Only rows whose
    // values differ are touched, so the migration is idempotent and minimally noisy.
    await queryRunner.query(`
      WITH canonical_draft AS (
        SELECT DISTINCT ON (av.app_id)
               av.app_id,
               av.app_name,
               av.slug,
               av.icon,
               av.is_public
        FROM app_versions av
        WHERE av.version_type = 'version'
          AND av.status = 'DRAFT'
          AND av.is_stub = false
        ORDER BY av.app_id, av.updated_at DESC
      )
      UPDATE app_versions p
      SET app_name  = d.app_name,
          slug      = d.slug,
          icon      = d.icon,
          is_public = d.is_public
      FROM canonical_draft d
      WHERE p.app_id = d.app_id
        AND p.version_type = 'version'
        AND p.status = 'PUBLISHED'
        AND p.is_stub = false
        AND (
          p.app_name  IS DISTINCT FROM d.app_name OR
          p.slug      IS DISTINCT FROM d.slug OR
          p.icon      IS DISTINCT FROM d.icon OR
          p.is_public IS DISTINCT FROM d.is_public
        );
    `);
  }

  public async down(): Promise<void> {
    // Irreversible: this overwrites drifted published metadata with the canonical
    // draft values; the pre-fix (corrupted) values are not retained, so there is
    // nothing to restore.
  }
}
