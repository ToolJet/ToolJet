import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NEUTRALISED for the lts->latest migration flow.
 *
 * This migration originally auto-RELEASED every existing module: it took each module's latest
 * version, set it status=PUBLISHED + current_environment_id=production, and pointed
 * apps.current_version_id at it.
 *
 * The migration path now PRESERVES every version exactly as it is and only attaches it to the
 * default branch — it does NOT release modules or rewrite their status. Auto-releasing turned a
 * module whose only version is a DRAFT into a draftless PUBLISHED module, which then has no
 * editable version. A customer releases a module themselves (and creates a draft to edit it)
 * through the normal flow when they are ready.
 *
 * Safe to make a no-op:
 *   - Beta/main already ran the original version (recorded), so they are unaffected.
 *   - A fresh install has no modules, so the original was a no-op there too.
 */
export class PromoteAndReleaseExistingModuleVersions1776419051000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally does nothing — see the class comment. Modules keep their exact status and
    // current_version_id, and stay attached to the default branch.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op.
  }
}
