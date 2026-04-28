import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill branch_id on existing module versions so they participate in branch-scoped
 * git sync just like app versions.
 *
 * Pre-condition: module type=='module' apps existed before workspace branching arrived
 * for modules — their app_versions rows have branch_id = NULL.  For every org that has
 * at least one workspace branch (i.e. git sync is configured), point those NULL
 * branch_ids at the org's default branch.  Versions on orgs without a workspace branch
 * remain branch_id = NULL (unchanged).
 *
 * Mirror of the in-process backfill that hydrateStubApp does for app versions
 * (see ee/platform-git-sync/pull.service.ts ~L660 — "Legacy fix: backfill branch_id
 * on non-stub VERSION-type versions"). Doing it here avoids waiting for the first
 * hydrate to clean up legacy module rows.
 */
export class BackfillModuleVersionBranchId1776550000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
        AND a.type = 'module'
        AND av.branch_id IS NULL
        AND COALESCE(av.is_stub, false) = false;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: the legacy state had branch_id = NULL for every module version. Reverting
    // would clear branch_id even for module versions created after this migration, which
    // would break branch-scoped lookups. Skip the down step intentionally.
  }
}
