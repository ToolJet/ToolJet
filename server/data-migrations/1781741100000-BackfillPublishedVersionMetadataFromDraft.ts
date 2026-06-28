import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPublishedVersionMetadataFromDraft1781741100000 implements MigrationInterface {
  // One-time data fix: copy the four user-facing metadata fields
  // (app_name / slug / icon / is_public) from each app's canonical DRAFT
  // version_type='version' row on the DEFAULT branch onto that app's PUBLISHED
  // version_type='version' rows. The DRAFT row is the single source of truth
  // (mirrors propagate_app_version_metadata / sync_published_app_version_metadata_
  // from_draft from 1781741000000), but those triggers only keep rows in sync
  // GOING FORWARD — published snapshots that drifted before the triggers existed
  // stay stale. This realigns them.
  //
  // Ordering: must run AFTER MakeAppVersionBranchIdNotNullAndGitSyncFlags
  // (1781741000000), which backfills branch_id onto the org default branch and
  // makes it NOT NULL. Before that backfill, gitsync-off rows have branch_id IS
  // NULL and are not yet on the default branch, so the canonical-draft lookup
  // below would miss them. (It also transitively satisfies the dependency on
  // EnsureDefaultBranchForAllOrganizations 1781740800000.)
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Canonical DRAFT per app: the non-stub DRAFT version_type='version' row on the
    // org's default branch. If more than one exists (gitsync-off can have several),
    // pick the same one the runtime/triggers pick: is_git_sync row first, then most
    // recently updated. Only rows whose values actually differ are touched, so the
    // updated_at bump and the (now-present) sync trigger fire only where needed.
    await queryRunner.query(`
      WITH canonical_draft AS (
        SELECT DISTINCT ON (av.app_id)
               av.app_id,
               av.app_name,
               av.slug,
               av.icon,
               av.is_public
        FROM app_versions av
        JOIN organization_git_sync_branches wb
          ON wb.id = av.branch_id AND wb.is_default = true
        WHERE av.version_type = 'version'
          AND av.status = 'DRAFT'
          AND av.is_stub = false
        ORDER BY av.app_id, av.is_git_sync DESC, av.updated_at DESC
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
